#!/bin/bash
# Signal Lost 24/7 Server Keepalive Script
# Place in /root/.openclaw/workspace/signal-lost-tasks/start-server.sh

DIR="/root/.openclaw/workspace/signal-lost-tasks"
PORT=8080
PIDFILE="/tmp/signal-lost-server.pid"

check_running() {
  if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
      echo "Server already running (PID: $PID)"
      return 0
    fi
  fi
  return 1
}

start_server() {
  echo "Starting Signal Lost server on port $PORT..."
  cd "$DIR" || exit 1
  nohup python3 -m http.server "$PORT" --directory "$DIR" > /tmp/signal-lost-server.log 2>&1 &
  echo $! > "$PIDFILE"
  sleep 2
  if check_running; then
    echo "Server started successfully"
    echo "Logs: /tmp/signal-lost-server.log"
    echo "PID: $(cat $PIDFILE)"
  else
    echo "Failed to start server"
    exit 1
  fi
}

stop_server() {
  if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    echo "Stopping server (PID: $PID)..."
    kill "$PID" 2>/dev/null
    rm -f "$PIDFILE"
    echo "Server stopped"
  else
    echo "No PID file found, trying to find process..."
    pkill -f "http.server.*$PORT.*$DIR"
  fi
}

restart_server() {
  stop_server
  sleep 1
  start_server
}

case "${1:-start}" in
  start)
    if check_running; then
      echo "Server is already running. Use restart to force."
    else
      start_server
    fi
    ;;
  stop)
    stop_server
    ;;
  restart)
    restart_server
    ;;
  status)
    if check_running; then
      echo "Server is running (PID: $(cat $PIDFILE))"
      echo "Uptime: $(ps -o etime= -p "$(cat $PIDFILE)" 2>/dev/null || echo 'unknown')"
    else
      echo "Server is not running"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
