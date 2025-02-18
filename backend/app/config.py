from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv
from typing import Optional

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
    # 数据库配置
    DATABASE_URL: str = DATABASE_URL
    
    # IPIPV API配置
    IPIPV_API_BASE_URL: str = "https://sandbox.ipipv.com"
    IPIPV_APP_KEY: str = "AK20241120145620"
    IPIPV_APP_SECRET: str = "bf3ffghlt0hpc4omnvc2583jt0fag6a4"
    
    # IPPROXY API配置
    IPPROXY_API_URL: str = "https://sandbox.ipipv.com"
    IPPROXY_APP_KEY: str = "AK20241120145620"
    IPPROXY_APP_SECRET: str = "bf3ffghlt0hpc4omnvc2583jt0fag6a4"
    IPPROXY_API_VERSION: str = "v2"
    IPPROXY_API_ENCRYPT: str = "AES"
    IPPROXY_APP_USERNAME: str = "test_user"
    
    # 主账号配置
    IPPROXY_MAIN_USERNAME: str = "test1006"  # 主账号用户名
    IPPROXY_MAIN_PASSWORD: str = "test1006"  # 主账号密码
    IPPROXY_MAIN_PHONE: str = "13800138000"  # 主账号手机号
    IPPROXY_MAIN_EMAIL: str = "test@example.com"  # 主账号邮箱
    IPPROXY_MAIN_AUTH_TYPE: int = 1  # 认证类型：1=企业认证
    IPPROXY_MAIN_AUTH_NAME: str = "测试企业"  # 认证名称
    IPPROXY_MAIN_AUTH_NO: str = "91110000123456789A"  # 认证号码（企业统一社会信用代码）
    IPPROXY_MAIN_STATUS: int = 1  # 账号状态：1=正常
    
    # JWT配置
    SECRET_KEY: str = SECRET_KEY
    ALGORITHM: str = ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES: int = ACCESS_TOKEN_EXPIRE_MINUTES
    
    # 其他配置
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # 测试配置
    TESTING: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True
        
        # 允许从环境变量加载额外的值
        extra = "allow"

settings = Settings() 