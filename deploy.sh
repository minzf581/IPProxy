#!/bin/bash

# 确保脚本在错误时退出
set -e

echo "开始部署..."

# 检查数据库 URL
if [ -z "$DATABASE_URL" ]; then
    echo "错误: DATABASE_URL 环境变量未设置"
    echo "请在 Railway 项目设置中配置数据库连接信息"
    exit 1
fi

# 打印数据库连接信息（隐藏敏感信息）
echo "数据库连接信息:"
MASKED_URL=$(echo "$DATABASE_URL" | sed -E 's/\/\/[^:]+:[^@]+@/\/\/*****:*****@/')
echo "DATABASE_URL=$MASKED_URL"

# 等待数据库准备就绪
echo "等待数据库准备就绪..."
max_retries=10
count=0

# 首先确保安装了必要的包
pip install --no-cache-dir psycopg2-binary

while ! python -c "
import sys
import psycopg2
import os
import logging
import traceback
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL environment variable is not set')
        
    logger.info('尝试连接数据库...')
    # 解析数据库URL并打印非敏感信息
    db_url = urlparse(database_url)
    logger.info(f'数据库主机: {db_url.hostname}')
    logger.info(f'数据库端口: {db_url.port}')
    logger.info(f'数据库名称: {db_url.path[1:]}')
    
    # 添加连接选项
    conn = psycopg2.connect(
        database_url,
        connect_timeout=5,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5
    )
    
    # 设置会话参数
    cur = conn.cursor()
    cur.execute('SET statement_timeout = 5000;')  # 5 秒超时
    cur.execute('SELECT 1')
    result = cur.fetchone()
    logger.info(f'查询结果: {result}')
    cur.close()
    conn.close()
    logger.info('数据库连接成功')
    sys.exit(0)
except Exception as e:
    logger.error(f'数据库连接失败: {str(e)}')
    logger.error(f'错误类型: {type(e).__name__}')
    logger.error(f'错误详情: {traceback.format_exc()}')
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