#!/bin/bash

# 确保脚本在错误时退出
set -e

echo "开始部署..."

# 等待数据库准备就绪
echo "等待数据库准备就绪..."
sleep 10

# 运行数据库迁移
echo "运行数据库迁移..."
alembic upgrade head

# 等待其他服务准备就绪
echo "等待其他服务准备就绪..."
sleep 5

# 启动应用
echo "启动应用..."
if [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    # 生产环境使用 gunicorn
    echo "使用 gunicorn 启动生产环境..."
    gunicorn app.main:app \
        -w 4 \
        -k uvicorn.workers.UvicornWorker \
        -b 0.0.0.0:$PORT \
        --timeout 120 \
        --access-logfile - \
        --error-logfile - \
        --log-level info
else
    # 开发环境使用 uvicorn
    echo "使用 uvicorn 启动开发环境..."
    uvicorn app.main:app \
        --host 0.0.0.0 \
        --port ${PORT:-8000} \
        --workers 4 \
        --log-level info
fi 