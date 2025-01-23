from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import Base
from app.database import engine, init_db, init_test_data
from app.routers import user, agent, dashboard, settings, auth

app = FastAPI()

# 配置 CORS
origins = [
    "http://localhost:3000",  # React 开发服务器
    "http://localhost:8000",  # FastAPI 服务器
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 注册路由
app.include_router(auth.router)  # 将auth路由放在最前面
app.include_router(user.router)
app.include_router(agent.router)
app.include_router(dashboard.router)
app.include_router(settings.router)

# 初始化数据库
Base.metadata.create_all(bind=engine)
init_db()
init_test_data()

@app.get("/")
async def root():
    return {"message": "Welcome to IPProxy API"} 