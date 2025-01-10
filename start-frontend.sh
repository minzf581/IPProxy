#!/bin/bash

# 查找并杀死在3000端口运行的进程
PORT=3000
PID=$(lsof -t -i:$PORT)
if [ ! -z "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID
fi

# 启动前端服务
echo "Starting frontend service..."
npm start
