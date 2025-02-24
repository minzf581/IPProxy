#!/bin/bash

# 确保脚本在错误时退出
set -e

echo "开始部署..."

# 设置 pip 配置
export PIP_DEFAULT_TIMEOUT=100
export PIP_DISABLE_PIP_VERSION_CHECK=1
export PIP_NO_CACHE_DIR=1

# 检查并创建必要的目录
echo "创建必要的目录..."
mkdir -p /app/alembic/versions
chown -R app:app /app/alembic

# 检查 alembic 命令是否可用
if ! command -v alembic &> /dev/null; then
    echo "错误: alembic 命令未找到"
    echo "尝试重新安装 alembic..."
    pip install --no-cache-dir --user alembic --timeout 100
    export PATH="/home/app/.local/bin:$PATH"
fi

# 安装必要的包
echo "安装必要的包..."
pip install --no-cache-dir --user psycopg2-binary pycryptodome --timeout 100

# 如果环境变量未设置，使用默认值
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgresql://postgres:VklXzDrDMygoJNZjzzSlNLMjmqKIPaYQ@postgres.railway.internal:5432/railway"
    echo "使用默认数据库连接信息"
fi

# 打印数据库连接信息（隐藏敏感信息）
echo "数据库连接信息:"
MASKED_URL=$(echo "$DATABASE_URL" | sed -E 's/\/\/[^:]+:[^@]+@/\/\/*****:*****@/')
echo "DATABASE_URL=$MASKED_URL"

# 等待数据库准备就绪
echo "等待数据库准备就绪..."
max_retries=10
count=0

# 打印所有环境变量（用于调试）
echo "当前环境变量:"
env | grep -v "PASSWORD\|SECRET\|KEY"

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
        connect_timeout=10,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5
    )
    
    # 设置会话参数
    cur = conn.cursor()
    cur.execute('SET statement_timeout = 10000;')  # 10 秒超时
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
    sleep 5
    count=$((count + 1))
done

echo "数据库连接成功！"

# 运行数据库迁移
echo "运行数据库迁移..."
echo "当前路径: $(pwd)"
echo "PATH: $PATH"
echo "Python 路径: $(which python)"
echo "Alembic 路径: $(which alembic || echo 'alembic not found')"

# 检查 alembic.ini 是否存在
if [ ! -f "alembic.ini" ]; then
    echo "错误: alembic.ini 不存在"
    exit 1
fi

# 重置数据库迁移版本
echo "重置数据库迁移版本..."
python -c "
import sys
import psycopg2
import os
from urllib.parse import urlparse

try:
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    # 检查 alembic_version 表是否存在
    cur.execute(\"\"\"
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'alembic_version'
        );
    \"\"\")
    table_exists = cur.fetchone()[0]
    
    if table_exists:
        print('删除现有的 alembic_version 表...')
        cur.execute('DROP TABLE alembic_version;')
        conn.commit()
    
    print('alembic_version 表已重置')
    cur.close()
    conn.close()
except Exception as e:
    print(f'重置迁移版本时出错: {str(e)}')
    sys.exit(1)
"

# 创建初始迁移
echo "创建初始迁移..."
alembic revision --autogenerate -m "initial migration"

# 运行迁移
echo "应用数据库迁移..."
alembic upgrade head

# 检查数据库表结构
echo "检查数据库表结构..."
python3 -c "
from sqlalchemy import create_engine, inspect
import os

database_url = os.getenv('DATABASE_URL')
engine = create_engine(database_url)
inspector = inspect(engine)

if 'users' in inspector.get_table_names():
    print('users 表已存在')
    print('表结构:')
    for column in inspector.get_columns('users'):
        print(f'{column[\"name\"]}: {column[\"type\"]}')
else:
    print('users 表不存在')
    exit(1)
"

# 启动应用
echo "启动应用..."
if [ "$RAILWAY_ENVIRONMENT" = "production" ]; then
    # 生产环境使用 gunicorn
    echo "使用 gunicorn 启动生产环境..."
    exec gunicorn app.main:app \
        -w 2 \
        -k uvicorn.workers.UvicornWorker \
        -b 0.0.0.0:$PORT \
        --timeout 120 \
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
        --log-level info \
        --timeout-keep-alive 60
fi 