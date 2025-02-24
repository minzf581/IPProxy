#!/bin/bash

# 确保脚本在错误时退出
set -e

echo "开始部署..."

# 等待数据库准备就绪
echo "等待数据库准备就绪..."
max_retries=10
count=0
while ! python -c "
import sys
import psycopg2
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    logger.info('尝试连接数据库...')
    conn = psycopg2.connect(
        os.environ['DATABASE_URL'],
        connect_timeout=5
    )
    cur = conn.cursor()
    cur.execute('SELECT 1')
    cur.close()
    conn.close()
    logger.info('数据库连接成功')
    sys.exit(0)
except Exception as e:
    logger.error(f'数据库连接失败: {str(e)}')
    sys.exit(1)
"; do
    if [ $count -eq $max_retries ]; then
        echo "数据库连接超时，退出部署"
        exit 1
    fi
    echo "尝试连接数据库... ($(( count + 1 ))/$max_retries)"
    sleep 3
    count=$((count + 1))
done

echo "数据库连接成功！"

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
    exec gunicorn app.main:app \
        -w 2 \
        -k uvicorn.workers.UvicornWorker \
        -b 0.0.0.0:$PORT \
        --timeout 60 \
        --keep-alive 60 \
        --access-logfile - \
        --error-logfile - \
        --log-level info \
        --capture-output \
        --enable-stdio-inheritance \
        --graceful-timeout 30 \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --worker-class uvicorn.workers.UvicornWorker \
        --preload
else
    # 开发环境使用 uvicorn
    echo "使用 uvicorn 启动开发环境..."
    exec uvicorn app.main:app \
        --host 0.0.0.0 \
        --port ${PORT:-8000} \
        --workers 2 \
        --log-level info
fi 