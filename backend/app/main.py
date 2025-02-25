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
from starlette.middleware.base import BaseHTTPMiddleware
from app.models.base import Base
from app.database import engine, get_db, SessionLocal
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
    callback,
    business
)
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
import uvicorn
import logging
import asyncio
from app.models.user import User
from app.models.prices import AgentPrice, UserPrice
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
import traceback
from datetime import datetime
from sqlalchemy import create_engine
import os
from sqlalchemy.sql import text
from tenacity import retry, stop_after_attempt, wait_exponential

# 使用core/config.py中的配置
from app.core.config import settings
import logging.config

# 应用日志配置
logging.config.dictConfig(settings.LOGGING_CONFIG)

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

# 白名单路径
SKIP_AUTH_PATHS = [
    "/health",
    "/",
    "/api/auth/login",
    "/api/auth/refresh",
    "/docs",
    "/redoc",
    "/openapi.json"
]

# 数据库会话中间件类
class DBSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 跳过健康检查相关的端点
        if request.url.path in ["/", "/health", "/healthz"]:
            return await call_next(request)

        db = None
        try:
            db = SessionLocal()
            request.state.db = db
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(f"[DB Middleware] 数据库会话错误: {str(e)}")
            logger.error(traceback.format_exc())
            if db:
                db.rollback()
                db.close()
            raise HTTPException(
                status_code=500,
                detail={
                    "code": 500,
                    "message": "数据库服务错误",
                    "details": str(e)
                }
            )
        finally:
            if db:
                db.close()

# 认证中间件类
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 跳过健康检查相关的端点
        if request.url.path in ["/", "/health", "/healthz"]:
            return await call_next(request)

        try:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if not token:
                raise HTTPException(
                    status_code=401,
                    detail={"code": 401, "message": "未提供认证令牌"}
                )
                
            try:
                from app.services.auth import auth_service
                payload = auth_service.verify_token(token)
                if not payload or "sub" not in payload:
                    raise HTTPException(
                        status_code=401,
                        detail={"code": 401, "message": "无效的认证令牌"}
                    )
                    
                if hasattr(request.state, 'db'):
                    db = request.state.db
                    user = db.query(User).filter(User.id == int(payload["sub"])).first()
                    if not user:
                        raise HTTPException(
                            status_code=401,
                            detail={"code": 401, "message": "用户不存在"}
                        )
                    request.state.user = user
                    
            except jwt.InvalidTokenError as e:
                raise HTTPException(
                    status_code=401,
                    detail={"code": 401, "message": "无效的认证令牌"}
                )
                
            return await call_next(request)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[Auth Middleware] 认证错误: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": f"认证过程发生错误: {str(e)}"}
            )

# 配置中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 按照正确的顺序添加中间件
app.add_middleware(AuthMiddleware)  # 认证中间件后执行
app.add_middleware(DBSessionMiddleware)  # 数据库中间件先执行

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

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def check_db_connection():
    """检查数据库连接，带重试机制"""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"数据库连接检查失败: {str(e)}")
        raise

@app.get("/")
@app.get("/health")
@app.get("/healthz")
async def health_check():
    """带详细日志的健康检查端点"""
    request_time = datetime.now().isoformat()
    logger.info(f"[Health Check] 收到健康检查请求 - 时间: {request_time}")
    
    try:
        # 记录系统信息
        import psutil
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        logger.info(f"[Health Check] 系统状态 - CPU: {cpu_percent}%, "
                   f"内存: {memory.percent}%, "
                   f"磁盘: {disk.percent}%")
        
        # 检查数据库连接
        logger.info("[Health Check] 尝试连接数据库...")
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
                logger.info("[Health Check] 数据库连接成功")
                db_status = "connected"
        except Exception as db_err:
            logger.error(f"[Health Check] 数据库连接失败: {str(db_err)}")
            db_status = "error"
            
        # 构建响应
        response_data = {
            "status": "ok",
            "timestamp": request_time,
            "database": db_status,
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent
            }
        }
        
        logger.info(f"[Health Check] 返回响应: {response_data}")
        return JSONResponse(
            status_code=200,
            content=response_data
        )
        
    except Exception as e:
        error_msg = f"健康检查遇到错误: {str(e)}"
        logger.error(f"[Health Check] {error_msg}")
        logger.error(f"[Health Check] 错误堆栈: {traceback.format_exc()}")
        
        # 即使发生错误也返回 200
        return JSONResponse(
            status_code=200,
            content={
                "status": "ok",
                "timestamp": request_time,
                "error": error_msg
            }
        )

# 添加启动事件处理器
@app.on_event("startup")
async def startup_event():
    """应用启动时的处理器"""
    logger.info("\n=== 应用启动 ===")
    logger.info(f"环境: {os.getenv('ENV', 'development')}")
    logger.info(f"PYTHONPATH: {os.getenv('PYTHONPATH', 'Not set')}")
    logger.info(f"工作目录: {os.getcwd()}")
    logger.info(f"数据库 URL: {settings.DATABASE_URL.replace(settings.DATABASE_URL.split('@')[0], '***')}")
    
    # 检查关键目录和文件
    logger.info("\n=== 目录和文件检查 ===")
    current_dir = os.getcwd()
    logger.info(f"当前目录内容: {os.listdir(current_dir)}")
    
    # 检查端口占用
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('0.0.0.0', 8000))
        logger.info("端口 8000 可用")
        sock.close()
    except Exception as e:
        logger.error(f"端口 8000 检查失败: {str(e)}")
    
    logger.info("=== 启动检查完成 ===\n")

# 注册路由
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(user.router, prefix="/api", tags=["用户"])
app.include_router(agent.router, prefix="/api", tags=["代理商"])
app.include_router(dashboard.router, prefix="/api")
app.include_router(transaction.router, prefix="/api")
app.include_router(order.router, prefix="/api")
app.include_router(proxy.router, prefix="/api")
app.include_router(instance.router, prefix="/api")
app.include_router(area.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(callback.router, prefix="/api")
app.include_router(business.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 