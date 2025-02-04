from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base
from app.database import engine, init_db, init_test_data, get_db
from app.routers import user, agent, dashboard, settings, auth, transaction, order
from sqlalchemy.orm import Session
import uvicorn
import logging

# 设置日志记录器
logger = logging.getLogger(__name__)

app = FastAPI(title="IPProxy API")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由 - 使用全局前缀
prefix = "/api"  # 恢复/api前缀
app.include_router(auth.router, prefix=prefix, tags=["auth"])
app.include_router(user.router, prefix=prefix, tags=["user"])
app.include_router(agent.router, prefix=prefix, tags=["agent"])
app.include_router(dashboard.router, prefix=prefix, tags=["dashboard"])
app.include_router(settings.router, prefix=prefix, tags=["settings"])
app.include_router(transaction.router, prefix=prefix, tags=["transaction"])
app.include_router(order.router, prefix=prefix, tags=["order"])

# 打印所有注册的路由
@app.on_event("startup")
async def print_routes():
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
    await init_db()
    await init_test_data()

@app.get("/")
async def root():
    return {"message": "Welcome to IPProxy API"}

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