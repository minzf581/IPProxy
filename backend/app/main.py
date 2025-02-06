"""
# IP代理管理系统 - 主应用入口
# ===========================
#
# 重要提示：
# ---------
# 1. 此文件是整个应用的核心入口，修改时需要格外谨慎
# 2. 路由注册的顺序会影响路由的匹配优先级
# 3. 所有模块共享相同的路由前缀(/api)，修改时需要同步更新前端配置
#
# 依赖关系：
# ---------
# - 前端配置文件：src/config/api.ts
# - 前端服务层：src/services/*.ts
# - 后端路由模块：app/routers/*.py
# - 后端服务层：app/services/*.py
#
# 修改注意事项：
# ------------
# 1. 路由前缀(/api)：
#    - 影响所有API路由
#    - 需要与前端API配置(src/config/api.ts)保持同步
#    - 修改时需要更新所有相关文档
#
# 2. 中间件配置：
#    - CORS设置影响跨域请求
#    - 数据库会话中间件影响所有数据库操作
#    - 中间件顺序会影响请求处理流程
#
# 3. 异常处理：
#    - 全局异常处理器影响所有路由响应
#    - 需要与前端错误处理保持一致
#    - 自定义异常需要在此处注册处理器
#
# 4. 路由注册：
#    - 保持路由前缀一致性
#    - 确保与API文档同步
#    - 验证前端请求路径匹配
#
# 5. 数据库配置：
#    - 确保连接参数正确
#    - 保持模型与数据库结构同步
#    - 初始化脚本需要定期维护
"""

from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base
from app.database import engine, init_db, init_test_data, get_db
from app.routers import user, agent, dashboard, auth, transaction, order, proxy, instance, area, settings
from app.services.product_inventory_service import ProductInventoryService
from app.services.ipipv_base_api import IPIPVBaseAPI
import uvicorn
import logging
import asyncio
from app.models.user import User
from app.models.agent_price import AgentPrice
from decimal import Decimal
from app.core.security import get_password_hash
from app.api.endpoints import product
from app.core.config import settings as app_settings
import logging.config

# 配置日志
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s [%(name)s] %(levelname)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout",
            "level": "INFO",
        },
        "file": {
            "class": "logging.FileHandler",
            "formatter": "default",
            "filename": "app.log",
            "mode": "a",
            "level": "INFO",
        }
    },
    "loggers": {
        "app.services.product_inventory_service": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False
        },
        "app.services.area_service": {
            "level": "WARNING",  # 设置区域服务的日志级别为WARNING，减少输出
            "handlers": ["console"],
            "propagate": False
        },
        "httpx": {
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False
        },
        "asyncio": {
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"]
    }
}

# 应用日志配置
logging.config.dictConfig(LOGGING_CONFIG)

# 获取应用的日志记录器
logger = logging.getLogger(__name__)

app = FastAPI(
    title="IP代理管理系统",
    description="IP代理管理系统API文档",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有源，生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头部
    expose_headers=["*"]  # 暴露所有头部
)

# 设置路由前缀
prefix = "/api"

# 注册路由
app.include_router(auth.router, prefix=prefix, tags=["认证"])
app.include_router(user.router, prefix=prefix, tags=["用户"])
app.include_router(agent.router, prefix=prefix, tags=["代理商"])
app.include_router(proxy.router, prefix=prefix, tags=["代理"])
app.include_router(order.router, prefix=prefix, tags=["订单"])
app.include_router(instance.router, prefix=prefix, tags=["实例"])
app.include_router(dashboard.router, prefix=prefix, tags=["仪表盘"])
app.include_router(settings.router, prefix=prefix, tags=["设置"])
app.include_router(area.router, prefix=prefix, tags=["区域"])
app.include_router(product.router, prefix=prefix, tags=["产品"])

async def ensure_default_users():
    """确保默认用户存在"""
    db = next(get_db())
    try:
        # 检查管理员用户
        admin = db.query(User).filter_by(username="admin").first()
        if not admin:
            logger.info("创建默认管理员用户...")
            admin = User(
                username="admin",
                password=get_password_hash("admin123"),
                email="admin@example.com",
                is_admin=True,
                is_agent=False,
                status=1,
                balance=1000.0
            )
            db.add(admin)
            db.commit()
            logger.info("默认管理员用户创建成功")

        # 检查代理商用户
        agent = db.query(User).filter_by(username="agent").first()
        if not agent:
            logger.info("创建默认代理商用户...")
            agent = User(
                username="agent",
                password=get_password_hash("agent123"),
                email="agent@example.com",
                is_admin=False,
                is_agent=True,
                status=1,
                balance=500.0
            )
            db.add(agent)
            db.commit()
            logger.info("默认代理商用户创建成功")

            # 为代理商创建价格配置
            agent_price = db.query(AgentPrice).filter_by(agent_id=agent.id).first()
            if not agent_price:
                agent_price = AgentPrice(
                    agent_id=agent.id,
                    dynamic_proxy_price=Decimal('0.1'),
                    static_proxy_price=Decimal('0.2')
                )
                db.add(agent_price)
                db.commit()
                logger.info("代理商价格配置创建成功")

    except Exception as e:
        logger.error(f"确保默认用户存在时发生错误: {str(e)}")
        db.rollback()
    finally:
        db.close()

# 打印所有注册的路由
@app.on_event("startup")
async def print_routes():
    """打印所有注册的路由"""
    logger.info("\n=== Registered Routes ===")
    logger.info("Format: METHOD  PATH  [TAGS]")
    logger.info("-" * 80)
    
    routes = []
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            path = route.path
            tags = route.tags if hasattr(route, "tags") else []
            routes.append((methods, path, tags))
    
    # 按路径排序
    routes.sort(key=lambda x: x[1])
    
    # 打印路由
    for methods, path, tags in routes:
        tags_str = f"[{', '.join(tags)}]" if tags else ""
        logger.info(f"{methods:<10} {path:<50} {tags_str}")
    
    logger.info("-" * 80)
    logger.info(f"Total routes: {len(routes)}")
    logger.info("=== End Routes ===\n")

# 全局异常处理器
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """处理HTTP异常"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.status_code,
            "message": exc.detail.get("message", str(exc.detail)) if isinstance(exc.detail, dict) else str(exc.detail)
        },
        headers=exc.headers
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """处理其他异常"""
    return JSONResponse(
        status_code=500,
        content={
            "code": 500,
            "message": "服务器内部错误"
        }
    )

# 初始化数据库
@app.on_event("startup")
async def startup_event():
    """应用启动时的初始化操作"""
    try:
        # 初始化数据库
        init_db()
        logger.info("数据库初始化完成")

        # 确保默认用户存在
        await ensure_default_users()
        logger.info("默认用户检查完成")

        logger.info("应用启动成功")
    except Exception as e:
        logger.error(f"启动失败: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时的清理操作"""
    logger.info("应用正在关闭...")

@app.get("/")
async def root():
    """健康检查接口"""
    return {"message": "IP代理管理系统API服务正常运行"}

# 添加全局依赖
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """为每个请求创建数据库会话"""
    response = Response("Internal server error", status_code=500)
    try:
        request.state.db = next(get_db())
        response = await call_next(request)
    finally:
        request.state.db.close()
    return response

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 