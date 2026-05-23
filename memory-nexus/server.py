#!/usr/bin/env python3
"""
Memory Nexus Server
- Static file serving for the Memory Nexus web app
- File upload API with persistent storage
"""

import os
import json
import shutil
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote

# Config
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
os.makedirs(UPLOAD_DIR, exist_ok=True)

MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
}

class NexusHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_cors_preflight(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._send_cors_preflight()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/files':
            return self._handle_list_files()
        if path.startswith('/api/download/'):
            return self._handle_download(path[len('/api/download/'):])

        # Static file serving
        return self._serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/upload':
            return self._handle_upload()

        self._send_json({'error': 'Not Found'}, 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/files/'):
            return self._handle_delete(path[len('/api/files/'):])

        self._send_json({'error': 'Not Found'}, 404)

    def _serve_static(self, path):
        if path == '/':
            path = '/index.html'

        safe_path = os.path.normpath(path).lstrip('/')
        filepath = os.path.join(BASE_DIR, safe_path)

        # Security: ensure file is within BASE_DIR
        if not filepath.startswith(BASE_DIR + os.sep) and filepath != BASE_DIR:
            self._send_json({'error': 'Forbidden'}, 403)
            return

        if not os.path.exists(filepath) or not os.path.isfile(filepath):
            self._send_json({'error': 'Not Found'}, 404)
            return

        ext = os.path.splitext(filepath)[1].lower()
        mime = MIME_TYPES.get(ext, 'application/octet-stream')

        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        with open(filepath, 'rb') as f:
            shutil.copyfileobj(f, self.wfile)

    def _handle_list_files(self):
        files = []
        for filename in sorted(os.listdir(UPLOAD_DIR)):
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                files.append({
                    'id': filename,
                    'name': filename,
                    'size': stat.st_size,
                    'date': int(stat.st_mtime),
                })
        self._send_json({'files': files})

    def _handle_download(self, filename):
        safe_name = os.path.basename(unquote(filename))
        filepath = os.path.join(UPLOAD_DIR, safe_name)

        if not os.path.exists(filepath) or not os.path.isfile(filepath):
            self._send_json({'error': 'File not found'}, 404)
            return

        self.send_response(200)
        self.send_header('Content-Type', 'application/octet-stream')
        self.send_header('Content-Disposition', f'attachment; filename="{safe_name}"')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        with open(filepath, 'rb') as f:
            shutil.copyfileobj(f, self.wfile)

    def _handle_upload(self):
        content_type = self.headers.get('Content-Type', '')
        content_length = int(self.headers.get('Content-Length', 0))

        if content_length > MAX_FILE_SIZE:
            self._send_json({'error': 'File too large'}, 413)
            return

        if content_length == 0:
            self._send_json({'error': 'No file provided'}, 400)
            return

        # Read raw body
        body = self.rfile.read(content_length)

        if content_type.startswith('multipart/form-data'):
            # Parse multipart
            boundary = content_type.split('boundary=')[1].strip()
            boundary_bytes = ('--' + boundary).encode()
            parts = body.split(boundary_bytes)

            uploaded = []
            for part in parts:
                part = part.strip()
                if not part or part == b'--':
                    continue

                # Split headers and body
                if b'\r\n\r\n' in part:
                    headers_raw, file_data = part.split(b'\r\n\r\n', 1)
                elif b'\n\n' in part:
                    headers_raw, file_data = part.split(b'\n\n', 1)
                else:
                    continue

                headers = headers_raw.decode('utf-8', errors='ignore').lower()
                if 'filename=' not in headers:
                    continue

                # Extract filename
                fn_start = headers.find('filename="') + 10
                fn_end = headers.find('"', fn_start)
                if fn_start < 10 or fn_end < 0:
                    continue
                filename = headers_raw.decode('utf-8', errors='ignore')[fn_start:fn_end]

                # Remove trailing newline from data
                file_data = file_data.rstrip(b'\r\n').rstrip(b'\n')

                safe_name = self._unique_name(filename)
                filepath = os.path.join(UPLOAD_DIR, safe_name)

                with open(filepath, 'wb') as f:
                    f.write(file_data)

                stat = os.stat(filepath)
                uploaded.append({
                    'id': safe_name,
                    'name': safe_name,
                    'size': stat.st_size,
                    'date': int(stat.st_mtime),
                })

            if len(uploaded) == 1:
                self._send_json(uploaded[0], 201)
            elif len(uploaded) > 1:
                self._send_json({'files': uploaded}, 201)
            else:
                self._send_json({'error': 'No file uploaded'}, 400)
        else:
            # Raw binary upload
            filename = self.headers.get('X-Filename', 'upload.bin')
            safe_name = self._unique_name(filename)
            filepath = os.path.join(UPLOAD_DIR, safe_name)

            with open(filepath, 'wb') as f:
                f.write(body)

            stat = os.stat(filepath)
            self._send_json({
                'id': safe_name,
                'name': safe_name,
                'size': stat.st_size,
                'date': int(stat.st_mtime),
            }, 201)

    def _handle_delete(self, filename):
        safe_name = os.path.basename(unquote(filename))
        filepath = os.path.join(UPLOAD_DIR, safe_name)

        if not os.path.exists(filepath):
            self._send_json({'error': 'File not found'}, 404)
            return

        os.remove(filepath)
        self._send_json({'deleted': safe_name})

    def _unique_name(self, filename):
        base = os.path.basename(filename)
        name, ext = os.path.splitext(base)
        safe = ''.join(c for c in name if c.isalnum() or c in '._-')[:64]
        unique = f"{safe}_{hashlib.sha256(os.urandom(8)).hexdigest()[:8]}{ext}"
        return unique


if __name__ == '__main__':
    PORT = 8888
    server = HTTPServer(('0.0.0.0', PORT), NexusHandler)
    print(f"Memory Nexus Server running on http://0.0.0.0:{PORT}")
    print(f"Uploads stored in: {UPLOAD_DIR}")
    try:
        server.serve_forever()
    except Exception as e:
        with open('/tmp/nexus_crash.log', 'a') as f:
            import traceback
            f.write(f"CRASH: {e}\n")
            f.write(traceback.format_exc())
        raise
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()
