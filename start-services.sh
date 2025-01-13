#!/bin/bash

# 终止已经运行的 Node.js 进程
killall node 2>/dev/null
echo "Killed existing Node.js processes"

# 启动后端服务器
echo "Starting backend server..."
node server.js &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动前端开发服务器
echo "Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

# 等待用户按 Ctrl+C
echo "Services are running. Press Ctrl+C to stop all services."
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
