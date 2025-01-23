from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import proxy, agent, user, instance, dashboard, auth
from app.database import init_test_data
from app.models import Base
from app.database import engine

app = FastAPI()

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 初始化测试数据
init_test_data()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(proxy.router)
app.include_router(agent.router)
app.include_router(user.router)
app.include_router(instance.router)
app.include_router(dashboard.router)

@app.get("/")
async def root():
    return {"message": "Welcome to IPProxy API"} 