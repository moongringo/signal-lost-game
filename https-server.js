/**
 * Signal Lost v2 — Local HTTPS Server
 * Serves the game directory over HTTPS with self-signed certs
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 4434;
const DIR = __dirname;

const options = {
  key: fs.readFileSync(path.join(DIR, 'server.key')),
  cert: fs.readFileSync(path.join(DIR, 'server.cert'))
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = https.createServer(options, (req, res) => {
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Signal Lost v2 HTTPS server running on https://0.0.0.0:${PORT}`);
  console.log(`  Local:  https://localhost:${PORT}`);
  console.log(`  Network: https://192.168.10.145:${PORT}`);
});
