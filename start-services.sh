#!/bin/bash

# 定义日志函数
log() {
    echo "[INFO] $1"
}

# 定义错误日志函数
error() {
    echo "[ERROR] $1"
    exit 1
}

# 停止现有服务
log "停止现有服务..."
pkill -f "uvicorn app.main:app" || true
pkill -f "npm run dev" || true

# 安装后端依赖
log "安装后端依赖..."
cd backend || error "无法进入后端目录"
pip3 install -r requirements.txt || error "安装Python依赖失败"

# 启动后端服务
log "启动后端服务..."
PYTHONPATH=. python3 -m uvicorn app.main:app --reload &

# 返回根目录并安装前端依赖
log "安装前端依赖..."
cd ..
npm install || error "安装前端依赖失败"

# 启动前端服务
log "启动前端服务..."
npm run dev &

# 等待服务启动
sleep 2

log "服务已启动！"
log "后端服务运行在: http://localhost:8000"
log "前端服务运行在: http://localhost:3000"
log "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait 