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

# 打印数据库连接信息（隐藏敏感信息）
echo "数据库连接信息:"
echo "数据库主机: postgres.railway.internal"
echo "数据库端口: 5432"
echo "数据库名称: railway"

# 等待数据库准备就绪
echo "等待数据库准备就绪..."
max_retries=10
count=0

while ! python -c "
import sys
import psycopg2
import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    logger.info('尝试连接数据库...')
    conn = psycopg2.connect(
        'postgresql://postgres:VklXzDrDMygoJNZjzzSlNLMjmqKIPaYQ@postgres.railway.internal:5432/railway',
        connect_timeout=10
    )
    cur = conn.cursor()
    cur.execute('SELECT 1')
    result = cur.fetchone()
    logger.info(f'查询结果: {result}')
    cur.close()
    conn.close()
    logger.info('数据库连接成功')
    sys.exit(0)
except Exception as e:
    logger.error(f'数据库连接失败: {str(e)}')
    logger.error(traceback.format_exc())
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
echo "Alembic 路径: $(which alembic)"

# 检查 alembic.ini 是否存在
if [ ! -f "alembic.ini" ]; then
    echo "错误: alembic.ini 不存在"
    exit 1
fi

# 确保数据库表存在
python -c "
from sqlalchemy import create_engine, inspect
engine = create_engine('postgresql://postgres:VklXzDrDMygoJNZjzzSlNLMjmqKIPaYQ@postgres.railway.internal:5432/railway')
inspector = inspect(engine)
tables = inspector.get_table_names()
if 'users' not in tables:
    print('创建初始数据库表...')
    from app.models.base import Base
    from app.models.user import User
    Base.metadata.create_all(engine)
    print('数据库表创建完成')
else:
    print('数据库表已存在')
"

# 运行迁移
echo "应用数据库迁移..."
alembic upgrade head || {
    echo "迁移失败，尝试重置迁移..."
    alembic revision --autogenerate -m "reset migration"
    alembic upgrade head
}

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