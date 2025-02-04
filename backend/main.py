from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import settings, user, auth, agent, dashboard, instance
import uvicorn
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(instance.router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
