from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from app.routers import auth, dashboard
from app.database import engine, Base

app = FastAPI()

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含认证路由
app.include_router(auth.router, prefix="/api")
# 包含仪表盘路由
app.include_router(dashboard.router, prefix="/api/dashboard")

@app.get("/")
async def root():
    return {"message": "Welcome to IP Proxy Management System"}
