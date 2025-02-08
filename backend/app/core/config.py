from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 获取项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    """应用配置类"""
    
    # 项目信息
    PROJECT_NAME: str = "IP代理管理系统"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "IP代理管理系统API文档"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # API配置
    API_V1_STR: str = "/api"
    API_VERSION: str = "v2"
    SERVER_HOST: str = os.getenv("SERVER_HOST", "api.example.com")
    
    # 安全配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-please-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # 数据库配置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR}/instance/test.db"
    )
    
    # CORS配置
    BACKEND_CORS_ORIGINS: list = ["*"]  # 在生产环境中应该设置具体的域名
    
    # IPIPV API配置
    IPIPV_API_BASE_URL: str = os.getenv("IPIPV_API_BASE_URL", "https://api.ipipv.net")
    IPPROXY_API_URL: str = os.getenv("IPPROXY_API_URL", "https://sandbox.ipipv.com")
    IPPROXY_APP_KEY: str = os.getenv("IPPROXY_APP_KEY", "AK20241120145620")
    IPPROXY_APP_SECRET: str = os.getenv("IPPROXY_APP_SECRET", "bf3ffghlt0hpc4omnvc2583jt0fag6a4")
    IPPROXY_CHANNEL_ID: str = os.getenv("IPPROXY_CHANNEL_ID", "CH20241120145620")
    IPPROXY_API_VERSION: str = os.getenv("IPPROXY_API_VERSION", "v2")
    IPPROXY_APP_USERNAME: str = os.getenv("IPPROXY_APP_USERNAME", "test_user")
    
    # 默认用户配置
    DEFAULT_ADMIN_USERNAME: str = "admin"
    DEFAULT_ADMIN_PASSWORD: str = "admin123"
    DEFAULT_ADMIN_EMAIL: str = "admin@example.com"
    DEFAULT_AGENT_USERNAME: str = "agent"
    DEFAULT_AGENT_PASSWORD: str = "agent123"
    DEFAULT_AGENT_EMAIL: str = "agent@example.com"
    
    # 代理商默认配置
    DEFAULT_AGENT_BALANCE: float = 500.0
    DEFAULT_DYNAMIC_PROXY_PRICE: float = 0.1
    DEFAULT_STATIC_PROXY_PRICE: float = 0.2
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s [%(name)s] %(levelname)s: %(message)s"
    LOG_HANDLERS: dict = {
        "console": {
            "level": "INFO",
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "level": "INFO",
            "formatter": "default",
            "class": "logging.FileHandler",
            "filename": "app.log",
            "mode": "a",
        }
    }
    LOG_FORMATTERS: dict = {
        "default": {
            "format": "%(asctime)s [%(name)s] %(levelname)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    }
    LOG_LOGGERS: dict = {
        "app.services.product_inventory_service": {
            "level": "INFO",
            "handlers": ["console", "file"],
            "propagate": False
        }
    }
    
    # 测试配置
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# 创建全局配置对象
settings = Settings()

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "DEBUG",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": "app.log",
            "formatter": "default",
            "level": "DEBUG",
        }
    },
    "loggers": {
        "app": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": True,
        }
    }
} 