#!/bin/bash

# 设置工作目录为脚本所在目录
cd "$(dirname "$0")" || exit 1

# 创建日志目录
mkdir -p logs

# 设置日志文件（使用绝对路径）
LOG_FILE="$PWD/logs/services-$(date '+%Y%m%d_%H%M%S').log"

# 创建日志文件
touch "$LOG_FILE"

# 定义日志函数
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local message="[$timestamp] [INFO] $1"
    echo "$message"
    echo "$message" > >(tee -a "$LOG_FILE")
}

# 定义错误日志函数
error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local message="[$timestamp] [ERROR] $1"
    echo "$message"
    echo "$message" > >(tee -a "$LOG_FILE")
    exit 1
}

# 记录启动信息
log "开始启动服务..."
log "日志文件位置: $LOG_FILE"

# 停止现有服务
log "停止现有服务..."
pkill -f "uvicorn app.main:app" || true
pkill -f "npm run dev" || true

# 检查后端目录和文件
if [ ! -d "backend" ]; then
    error "后端目录不存在"
fi

# 安装后端依赖
log "安装后端依赖..."
cd backend || error "无法进入后端目录"

if [ ! -f "requirements.txt" ]; then
    error "requirements.txt 不存在"
fi

pip3 install -r requirements.txt 2>&1 | tee -a "$LOG_FILE" || error "安装Python依赖失败"

# 启动后端服务
log "启动后端服务..."
PYTHONPATH=. python3 -m uvicorn app.main:app --reload 2>&1 | tee -a "$LOG_FILE" &

# 返回根目录并安装前端依赖
log "安装前端依赖..."
cd ..

if [ ! -f "package.json" ]; then
    error "package.json 不存在"
fi

npm install 2>&1 | tee -a "$LOG_FILE" || error "安装前端依赖失败"

# 启动前端服务
log "启动前端服务..."
npm run dev 2>&1 | tee -a "$LOG_FILE" &

# 等待服务启动
sleep 2

log "服务已启动！"
log "后端服务运行在: http://localhost:8000"
log "前端服务运行在: http://localhost:3000"
log "按 Ctrl+C 停止所有服务"

# 清理函数
cleanup() {
    log "正在停止所有服务..."
    pkill -f "uvicorn app.main:app"
    pkill -f "npm run dev"
    exit 0
}

# 捕获SIGINT信号（Ctrl+C）
trap cleanup SIGINT SIGTERM

# 等待任意子进程结束
wait
