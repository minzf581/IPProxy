# 使用 Python 3.9 作为基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai \
    PORT=8000

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
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

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn

# 切换到非 root 用户
USER app

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["./deploy.sh"] 