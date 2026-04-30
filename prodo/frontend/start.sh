#!/bin/bash
cd /home/rohith/desktop/NeuactProjectManagement/prodo/frontend

# Start Next.js on port 3421 (internal)
PORT=3421 NODE_ENV=production /usr/bin/node server.js > /home/rohith/desktop/NeuactProjectManagement/prodo/logs/frontend.log 2>&1 &
NEXTJS_PID=$!

# Give it a moment to start
sleep 3

# Start HTTPS proxy on port 3420 (forwards to 3421)
/usr/bin/node https-proxy.js >> /home/rohith/desktop/NeuactProjectManagement/prodo/logs/frontend.log 2>&1 &
PROXY_PID=$!

# Wait for both processes
wait $NEXTJS_PID $PROXY_PID
