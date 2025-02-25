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
    echo "$message" | tee -a "$LOG_FILE"
}

# 定义错误日志函数
error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local message="[$timestamp] [ERROR] $1"
    echo "$message" | tee -a "$LOG_FILE"
    exit 1
}

# 定义警告日志函数
warn() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local message="[$timestamp] [WARN] $1"
    echo "$message" | tee -a "$LOG_FILE"
}

# 检查环境变量
if [ -z "$ENV" ]; then
    export ENV="development"
fi

# 记录启动信息
log "开始启动服务..."
log "当前环境: $ENV"
log "日志文件位置: $LOG_FILE"

# 停止现有服务
log "停止现有服务..."
pkill -f "uvicorn app.main:app" || true
pkill -f "npm run dev" || true

# 检查后端目录和文件
if [ ! -d "backend" ]; then
    error "后端目录不存在"
fi

# 进入后端目录
cd backend || error "无法进入后端目录"

# 设置环境变量
export PYTHONPATH="$PWD"

# 创建数据目录
mkdir -p data

# 根据环境设置数据库连接
if [ "$ENV" = "production" ]; then
    if [ -z "$DATABASE_URL" ]; then
        error "生产环境需要设置 DATABASE_URL 环境变量"
    fi
    log "使用生产环境数据库: PostgreSQL"
else
    export DATABASE_URL="sqlite:///$PWD/data/app.db"
    log "使用开发环境数据库: SQLite"
fi

log "环境变量设置:"
log "ENV=$ENV"
log "PYTHONPATH=$PYTHONPATH"
log "DATABASE_URL=$DATABASE_URL"

# 检查数据库配置
if [ "$ENV" = "development" ]; then
    DB_FILE="data/app.db"
    INIT_DB=false

    # 确保数据目录存在并有正确的权限
    mkdir -p "$(dirname "$DB_FILE")"
    touch "$DB_FILE"
    chmod 666 "$DB_FILE"

    if [ ! -s "$DB_FILE" ]; then
        log "数据库文件为空，将进行初始化..."
        INIT_DB=true
    else
        # 检查数据库是否为空（检查users表是否有数据）
        USER_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
        if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
            log "数据库为空，将进行初始化..."
            rm -f "$DB_FILE"
            touch "$DB_FILE"
            chmod 666 "$DB_FILE"
            INIT_DB=true
        else
            log "数据库已存在且包含数据，跳过初始化..."
        fi
    fi
fi

# 安装后端依赖
log "安装后端依赖..."
if [ ! -f "requirements.txt" ]; then
    error "requirements.txt 不存在"
fi

pip3 install -r requirements.txt 2>&1 | tee -a "$LOG_FILE"

# 根据需要初始化数据库
if [ "$ENV" = "development" ] && [ "$INIT_DB" = true ]; then
    # 初始化数据库
    log "初始化数据库..."
    python3 scripts/init_db.py 2>&1 | tee -a "$LOG_FILE"

    # 添加测试数据
    log "添加测试数据..."
    python3 scripts/add_test_data.py 2>&1 | tee -a "$LOG_FILE"
fi

# 启动后端服务
log "启动后端服务..."
if [ "$ENV" = "production" ]; then
    # 生产环境使用 gunicorn
    gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 2>&1 | tee -a "$LOG_FILE" &
else
    # 开发环境使用 uvicorn 的热重载模式
    python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | tee -a "$LOG_FILE" &
fi

# 返回根目录并安装前端依赖
cd ..

if [ "$ENV" = "development" ]; then
    log "安装前端依赖..."
    if [ ! -f "package.json" ]; then
        error "package.json 不存在"
    fi

    npm install 2>&1 | tee -a "$LOG_FILE"

    # 启动前端服务
    log "启动前端服务..."
    npm run dev 2>&1 | tee -a "$LOG_FILE" &
fi

# 等待服务启动
sleep 2

# 显示服务信息
log "服务已启动！"
log "后端服务运行在: http://localhost:8000"
if [ "$ENV" = "development" ]; then
    log "前端服务运行在: http://localhost:3000"
    log "开发环境已配置"
fi
log "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait
