#!/bin/bash
cd /root/.openclaw/workspace/memory-nexus
nohup python3 server.py > server.log 2>&1 &
echo "Server started, PID: $!"
