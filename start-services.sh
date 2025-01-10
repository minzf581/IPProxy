#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查并杀死指定端口的进程
kill_port_process() {
    local port=$1
    local pid=$(lsof -t -i:$port)
    if [ ! -z "$pid" ]; then
        print_message $YELLOW "Killing process on port $port (PID: $pid)"
        kill -9 $pid
        sleep 1
    fi
}

# 启动前端服务
start_frontend() {
    print_message $GREEN "Starting frontend service..."
    npm run dev &
    sleep 2
    print_message $GREEN "Frontend service started on port 3000"
}

# 启动代理服务器
start_proxy() {
    print_message $GREEN "Starting proxy server..."
    node server.js &
    sleep 2
}

# 主函数
main() {
    # 清理已存在的进程
    print_message $YELLOW "Checking for existing processes..."
    kill_port_process 3000
    kill_port_process 3001
    
    # 启动服务
    start_proxy
    start_frontend
    
    # 等待所有后台进程
    wait
}

# 清理函数
cleanup() {
    print_message $YELLOW "Cleaning up..."
    kill_port_process 3000
    kill_port_process 3001
    exit 0
}

# 注册清理函数
trap cleanup SIGINT SIGTERM

# 运行主函数
main
