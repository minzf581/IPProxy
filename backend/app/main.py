from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base
from app.database import engine, init_db, init_test_data, get_db
from app.routers import user, agent, dashboard, settings, auth, transaction, order, proxy, instance
from app.api.v2 import area
from sqlalchemy.orm import Session
import uvicorn
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="IP代理管理系统",
    description="IP代理管理系统API文档",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 明确指定允许的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(area.router, prefix=prefix, tags=["地区"])

# 打印所有注册的路由
@app.on_event("startup")
async def print_routes():
    """打印所有注册的路由"""
    logger.info("\n=== Registered Routes ===")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            logger.info(f"{methods:<10} {route.path}")
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