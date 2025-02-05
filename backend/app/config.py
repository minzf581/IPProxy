from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# JWT配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")  # 在生产环境中应该使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# 其他配置
APP_ID = os.getenv("APP_ID", "default_app_id")
APP_KEY = os.getenv("APP_KEY", "default_app_key")

class Settings(BaseSettings):
    IPIPV_API_BASE_URL: str = "https://api.ipipv.net"
    DATABASE_URL: str = DATABASE_URL
    IPPROXY_API_URL: str = os.getenv("IPPROXY_API_URL", "https://sandbox.ipipv.com")
    IPPROXY_APP_KEY: str = os.getenv("IPPROXY_APP_KEY", "AK20241120145620")
    IPPROXY_APP_SECRET: str = os.getenv("IPPROXY_APP_SECRET", "bf3ffghlt0hpc4omnvc2583jt0fag6a4")

    class Config:
        env_file = ".env"

settings = Settings() 