#!/bin/bash

# 查找并杀死在8000端口运行的进程
PORT=8000
PID=$(lsof -t -i:$PORT)
if [ ! -z "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)"
    kill -9 $PID
fi

# 确保所有Python依赖已安装
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# 启动后端服务
echo "Starting backend service..."
python3 -m flask --app backend/app/__init__.py run --port 8000
