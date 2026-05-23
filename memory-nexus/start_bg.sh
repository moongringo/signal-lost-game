#!/bin/bash
fuser -k 8080/tcp 2>/dev/null
sleep 1
cd /root/.openclaw/workspace/memory-nexus
nohup python3 server.py > /tmp/nexus_server.log 2>&1 &
disown
sleep 2
echo "Server started"
