#!/usr/bin/env python3
import sys
sys.path.insert(0, '/root/.openclaw/workspace/memory-nexus')

from server import HTTPServer, NexusHandler
import threading
import urllib.request
import time

# Start server in a thread
server = HTTPServer(('127.0.0.1', 8081), NexusHandler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
time.sleep(1)

print("Server started on port 8081")

# Test requests
try:
    resp = urllib.request.urlopen('http://127.0.0.1:8081/api/files', timeout=5)
    print("GET /api/files:", resp.status, resp.read().decode())
except Exception as e:
    print("GET /api/files FAILED:", e)

try:
    resp = urllib.request.urlopen('http://127.0.0.1:8081/', timeout=5)
    print("GET /:", resp.status)
except Exception as e:
    print("GET / FAILED:", e)

server.shutdown()
print("Test complete")
