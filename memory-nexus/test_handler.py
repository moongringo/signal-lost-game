#!/usr/bin/env python3
import sys
sys.path.insert(0, '/root/.openclaw/workspace/memory-nexus')

# Test the server handler directly
from server import NexusHandler
import io

# Simulate a request
class MockRequest:
    def __init__(self):
        self.rfile = io.BytesIO(b'')
        self.wfile = io.BytesIO()
        self.client_address = ('127.0.0.1', 12345)
    def makefile(self, mode, *args, **kwargs):
        if 'r' in mode:
            return self.rfile
        if 'w' in mode:
            return self.wfile
        return io.BytesIO()

req = MockRequest()
try:
    handler = NexusHandler(req, req.client_address, None)
    print("Handler created successfully")
    print("Response:", req.wfile.getvalue()[:200])
except Exception as e:
    print("ERROR:", e)
    import traceback
    traceback.print_exc()
