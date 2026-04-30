#!/bin/bash
cd /home/rohith/desktop/NeuactProjectManagement/prodo/frontend

# Start Next.js on port 3421
PORT=3421 NODE_ENV=production /usr/bin/node server.js >> logs/frontend.log 2>&1 &
echo $! > /tmp/nextjs.pid

# Start HTTPS proxy on port 3420
sleep 2
/usr/bin/node https-proxy.js >> logs/frontend.log 2>&1 &
echo $! > /tmp/proxy.pid

# Keep the script running
wait
