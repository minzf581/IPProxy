# 使用 Python 3.9 作为基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai \
    PORT=8000 \
    DATABASE_URL="postgresql://postgres:VklXzDrDMygoJNZjzzSlNLMjmqKIPaYQ@postgres.railway.internal:5432/railway" \
    PATH="/home/app/.local/bin:$PATH" \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN useradd -m -U app && \
    chown -R app:app /app

# 复制项目文件
COPY backend/requirements.txt .
COPY backend/app ./app
COPY backend/alembic.ini .
COPY backend/alembic ./alembic
COPY deploy.sh .

# 设置文件权限
RUN chown -R app:app /app && \
    chmod +x deploy.sh

# 切换到非 root 用户
USER app

# 安装 pip 并升级
RUN curl -sSL https://bootstrap.pypa.io/get-pip.py | python3 || \
    (sleep 5 && curl -sSL https://bootstrap.pypa.io/get-pip.py | python3)

# 安装基础工具
RUN pip install --no-cache-dir --user pip setuptools wheel || \
    (sleep 5 && pip install --no-cache-dir --user pip setuptools wheel)

# 分步安装 Python 依赖，添加重试机制
RUN for i in 1 2 3; do \
        pip install --no-cache-dir --user -r requirements.txt && break || \
        echo "Attempt $i failed! Retrying in 10 seconds..." && \
        sleep 10; \
    done

# 安装额外的依赖，添加重试机制
RUN for i in 1 2 3; do \
        pip install --no-cache-dir --user \
            psycopg2-binary \
            gunicorn \
            alembic \
            pydantic[email] \
            aiohttp \
            pandas \
            numpy && break || \
        echo "Attempt $i failed! Retrying in 10 seconds..." && \
        sleep 10; \
    done

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["./deploy.sh"] 