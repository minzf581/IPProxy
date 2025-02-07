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
    # IPIPV API 配置
    IPIPV_API_BASE_URL: str = os.getenv("IPIPV_API_BASE_URL", "https://api.ipipv.net")
    IPIPV_API_VERSION: str = os.getenv("IPIPV_API_VERSION", "v2")
    IPIPV_API_ENCRYPT: str = os.getenv("IPIPV_API_ENCRYPT", "AES")
    IPIPV_APP_USERNAME: str = os.getenv("IPIPV_APP_USERNAME", "test_user")
    
    # 数据库配置
    DATABASE_URL: str = DATABASE_URL
    
    # IPPROXY API 配置
    IPPROXY_API_URL: str = os.getenv("IPPROXY_API_URL", "https://sandbox.ipipv.com")
    IPPROXY_APP_KEY: str = os.getenv("IPPROXY_APP_KEY", "AK20241120145620")
    IPPROXY_APP_SECRET: str = os.getenv("IPPROXY_APP_SECRET", "bf3ffghlt0hpc4omnvc2583jt0fag6a4")
    IPPROXY_API_VERSION: str = os.getenv("IPPROXY_API_VERSION", "v2")
    IPPROXY_API_ENCRYPT: str = os.getenv("IPPROXY_API_ENCRYPT", "AES")
    IPPROXY_APP_USERNAME: str = os.getenv("IPPROXY_APP_USERNAME", "test_user")
    
    # 测试配置
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 