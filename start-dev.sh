#!/bin/bash
# Start development server without timeout issues

# Kill any existing Next.js processes
pkill -f "next dev" || true

# Start the server in background
nohup bash -c "PORT=3002 npm run dev > /tmp/nextjs.log 2>&1 &"

echo "Starting Next.js development server on port 3002..."
sleep 3

# Check if server is running
if ps aux | grep "next dev" | grep -v grep > /dev/null; then
    echo "✓ Server is running successfully"
    echo "Access your app at: http://localhost:3002"
    echo "View logs with: tail -f /tmp/nextjs.log"
else
    echo "✗ Server failed to start"
    exit 1
fi