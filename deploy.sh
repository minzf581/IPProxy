#!/bin/bash

# 确保脚本在错误时退出
set -e

echo "开始部署..."

# 运行数据库迁移
echo "运行数据库迁移..."
alembic upgrade head

# 启动应用
echo "启动应用..."
if [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    # 生产环境使用 gunicorn
    gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT --timeout 120
else
    # 开发环境使用 uvicorn
    uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4
fi 