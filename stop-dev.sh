#!/bin/bash
# Stop development server

echo "Stopping Next.js development server..."
pkill -f "next dev" || true

# Wait a moment for processes to stop
sleep 2

if ps aux | grep "next dev" | grep -v grep > /dev/null; then
    echo "✗ Some processes may still be running"
    ps aux | grep "next dev" | grep -v grep
else
    echo "✓ Server stopped successfully"
fi