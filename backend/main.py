from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, init_test_data
from app.routers import dashboard, auth, proxy, agent, user, settings

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 初始化测试数据
init_test_data()

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 只允许前端开发服务器
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# 注册路由
app.include_router(auth.router, prefix="/api")  # 添加/api前缀
app.include_router(dashboard.router, prefix="/api")
app.include_router(proxy.router)  # proxy路由已经包含了完整的路径
app.include_router(agent.router)  # agent路由已经包含了完整的路径
app.include_router(user.router)   # user路由已经包含了完整的路径
app.include_router(settings.router)  # settings路由已经包含了完整的路径
