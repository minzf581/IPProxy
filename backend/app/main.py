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
from app.database import engine, get_db
from app.routers import (
    user, 
    agent, 
    dashboard, 
    auth, 
    transaction, 
    order, 
    proxy, 
    instance, 
    area, 
    settings as settings_router,  # 重命名避免冲突
    callback
)
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
import uvicorn
import logging
import asyncio
from app.models.user import User
from app.models.agent_price import AgentPrice
from decimal import Decimal
from app.core.security import get_password_hash, SECRET_KEY, ALGORITHM
from app.api.endpoints import product, static_order
from app.core.config import settings
import logging.config
from fastapi.security import OAuth2PasswordBearer
from app.services.auth import verify_token, get_current_user
from contextlib import asynccontextmanager
from fastapi import status
import jwt
from app.api.v1.api import api_router

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
        "app.services.ipipv_base_api": {
            "level": "INFO",
            "handlers": ["console", "file"],
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    try:
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表已创建")

        # 确保默认用户存在
        await ensure_default_users()
        logger.info("默认用户检查完成")

        logger.info("应用启动成功")
    except Exception as e:
        logger.error(f"启动失败: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("应用正在关闭...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="IP代理管理系统API文档",
    version="1.0.0",
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api")  # 认证路由
app.include_router(user.router, prefix="/api")
app.include_router(order.router, prefix="/api")
app.include_router(proxy.router, prefix="/api")
app.include_router(area.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(product.router, prefix="/api")
app.include_router(static_order.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")  # 使用重命名后的路由
app.include_router(callback.router, prefix="/api")
app.include_router(agent.router, prefix="/api")  # 添加代理商路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 白名单路径
AUTH_WHITELIST = [
    "/api/auth/login",
    "/api/open/app/area/v2",
    "/api/open/app/city/list/v2",
    "/api/open/app/product/query/v2",
    "/api/open/app/location/options/v2",
    "/api/open/app/agent/list",  # 添加代理商列表接口
    "/api/open/app/agent/*/statistics",  # 添加代理商统计接口
    "/api/open/app/static/order/list/v2",  # 添加静态订单列表接口
    "/api/open/app/order/v2",  # 添加订单列表接口
    "/api/open/app/proxy/user/v2"  # 添加代理用户接口
]

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

@app.get("/")
async def root():
    """健康检查接口"""
    return {"message": "Welcome to IP Proxy API"}

# 添加认证中间件
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """认证中间件"""
    path = request.url.path
    logger.info(f"[Auth Middleware] Processing request: {path}")
    
    # 处理 OPTIONS 请求
    if request.method == "OPTIONS":
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Max-Age"] = "3600"
        return response
        
    # 检查是否是白名单路径
    if any(path.startswith(white_path.replace("*", "")) for white_path in AUTH_WHITELIST):
        logger.info(f"[Auth Middleware] Whitelist path: {path}, skipping auth")
        return await call_next(request)
        
    # 获取认证头
    auth_header = request.headers.get("Authorization", "")
    logger.info(f"[Auth Middleware] Authorization header: {auth_header}")
    
    if not auth_header or not auth_header.strip():
        logger.warning("[Auth Middleware] No Authorization header found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": 401,
                "message": "未提供认证信息"
            }
        )
        
    try:
        # 验证token格式
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            logger.warning("[Auth Middleware] Invalid auth scheme")
            raise HTTPException(
                status_code=401,
                detail={
                    "code": 401,
                    "message": "认证方案无效"
                },
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        token = parts[1]
        if not token:
            logger.warning("[Auth Middleware] Empty token")
            raise HTTPException(
                status_code=401,
                detail={
                    "code": 401,
                    "message": "token不能为空"
                },
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # 验证token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                logger.warning("[Auth Middleware] Invalid token payload")
                raise HTTPException(
                    status_code=401,
                    detail={
                        "code": 401,
                        "message": "无效的token"
                    },
                    headers={"WWW-Authenticate": "Bearer"}
                )
        except jwt.JWTError as e:
            logger.error(f"[Auth Middleware] JWT decode error: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail={
                    "code": 401,
                    "message": "无效的token"
                },
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # 设置用户ID到请求状态
        request.state.user_id = user_id
            
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"[Auth Middleware] Value error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail={
                "code": 401,
                "message": "认证格式错误"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.error(f"[Auth Middleware] Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "code": 500,
                "message": "服务器内部错误"
            }
        )

# 添加数据库中间件（注意：这个中间件必须在认证中间件之后注册，这样它会先执行）
@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    """为每个请求创建数据库会话"""
    db = next(get_db())
    request.state.db = db
    try:
        response = await call_next(request)
        return response
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 