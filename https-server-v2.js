/**
 * Signal Lost v2 — Simple static HTTPS server
 * Serves the game over HTTPS (needed for browser geolocation API)
 * Run: node https-server-v2.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 4434;
const HOST = '0.0.0.0';
const ROOT = __dirname;

// Generate self-signed cert if not exists
const certDir = path.join(ROOT, 'ssl');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('[SSL] Generating self-signed certificate...');
  const { execSync } = require('child_process');
  execSync(
    `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=NO/CN=localhost"`,
    { stdio: 'ignore' }
  );
  console.log('[SSL] Certificate generated');
}

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

const MIME_TYPES = {
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
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar'
};

const server = https.createServer(options, (req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  const os = require('os');
  const addresses = [];
  Object.values(os.networkInterfaces()).forEach(ifaces => {
    ifaces?.forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });

  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║     Signal Lost v2 — Game Server        ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  Local:   https://localhost:${PORT}         ║`);
  addresses.forEach(addr => {
    console.log(`  ║  Network: https://${addr}:${PORT}  ║`);
  });
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  🎮  /  — Signal Lost v2                ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  console.log('  GPS requires HTTPS. Opening https://localhost:' + PORT);
  console.log('  ⚠️  Self-signed cert — click "Advanced" → "Proceed"');
  console.log('  🛑  Press Ctrl+C to stop');
  console.log('');

  // Try to open browser
  try {
    const { execSync } = require('child_process');
    execSync(`xdg-open https://localhost:${PORT} 2>/dev/null || true`);
  } catch(e) {}
});
