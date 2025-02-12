from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "IP Proxy Management System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # IPIPV API 配置
    IPPROXY_API_URL: str = "https://sandbox.ipipv.com"
    IPPROXY_APP_KEY: str = "AK20241120145620"
    IPPROXY_APP_SECRET: str = "bf3ffghlt0hpc4omnvc2583jt0fag6a4"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 