#!/bin/bash
# Script to restart the backend server

echo "Stopping backend..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2

echo "Starting backend..."
cd "$(dirname "$0")"
nohup npm run dev > /tmp/backend.log 2>&1 &

echo "Backend PID: $!"
sleep 3

echo "Testing connection..."
curl -s http://localhost:3000/health | head -c 100
echo ""
echo ""
echo "✅ Backend restarted!"
echo "Check logs: tail -f /tmp/backend.log"

