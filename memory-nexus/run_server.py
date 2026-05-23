#!/usr/bin/env python3
"""
Memory Nexus Server - Background wrapper
Runs the HTTP server in a daemon thread and keeps main thread alive.
"""

import sys
sys.path.insert(0, '/root/.openclaw/workspace/memory-nexus')

from server import HTTPServer, NexusHandler, BASE_DIR, UPLOAD_DIR
import threading
import time

PORT = 8080

server = HTTPServer(('0.0.0.0', PORT), NexusHandler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()

print(f"Memory Nexus Server running on http://0.0.0.0:{PORT}")
print(f"Uploads stored in: {UPLOAD_DIR}")
print(f"Static files from: {BASE_DIR}")

# Keep main thread alive
while True:
    time.sleep(3600)
