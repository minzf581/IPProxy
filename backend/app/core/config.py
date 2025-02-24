from pydantic_settings import BaseSettings
from typing import Dict, Any, Optional, ClassVar
import logging.config
import os
from pathlib import Path

# 获取项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# 创建日志目录
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# 环境判断
ENV = os.getenv("ENV", "development")  # 默认为开发环境

class Settings(BaseSettings):
    PROJECT_NAME: str = "IP Proxy Management System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # 环境配置
    ENV: str = ENV
    DEBUG: bool = ENV == "development"
    
    # 数据库配置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR}/backend/app.db" if ENV == "development" else ""
    )
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://")
    
    # IPIPV API 配置
    IPIPV_API_BASE_URL: str = os.getenv("IPIPV_API_BASE_URL", "https://sandbox.ipipv.com")
    IPIPV_API_KEY: str = os.getenv("IPIPV_API_KEY", "AK20241120145620")
    IPIPV_API_SECRET: str = os.getenv("IPIPV_API_SECRET", "bf3ffghlt0hpc4omnvc2583jt0fag6a4")
    
    # 认证信息配置
    IPIPV_MAIN_AUTH_TYPE: int = int(os.getenv("IPIPV_MAIN_AUTH_TYPE", "1"))
    IPIPV_MAIN_AUTH_NAME: str = os.getenv("IPIPV_MAIN_AUTH_NAME", "测试公司")
    IPIPV_MAIN_AUTH_NO: str = os.getenv("IPIPV_MAIN_AUTH_NO", "3101112")
    IPIPV_MAIN_PHONE: str = os.getenv("IPIPV_MAIN_PHONE", "13800138000")
    IPIPV_MAIN_EMAIL: str = os.getenv("IPIPV_MAIN_EMAIL", "test1006@test.com")
    
    # API配置
    API_BASE_URL: str = os.getenv("API_BASE_URL", "https://sandbox.ipipv.com")
    API_KEY: str = os.getenv("API_KEY", "AK20241120145620")
    API_SECRET: str = os.getenv("API_SECRET", "bf3ffghlt0hpc4omnvc2583jt0fag6a4")
    
    # 日志配置
    LOGGING_CONFIG: ClassVar[Dict[str, Any]] = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': '%(asctime)s [%(name)s] %(levelname)s: %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            },
            'detailed': {
                'format': '%(asctime)s [%(name)s] %(levelname)s [%(filename)s:%(lineno)d]: %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'detailed',
                'level': 'DEBUG'
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': str(LOG_DIR / 'app.log'),
                'formatter': 'detailed',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'level': 'DEBUG'
            }
        },
        'loggers': {
            '': {  # root logger
                'handlers': ['console', 'file'],
                'level': 'INFO',
            },
            'app': {  # 应用日志
                'handlers': ['console', 'file'],
                'level': 'DEBUG',
                'propagate': False
            },
            'app.services': {  # 服务层日志
                'handlers': ['console', 'file'],
                'level': 'DEBUG',
                'propagate': False
            },
            'app.services.ipipv_base_api': {
                'level': 'DEBUG',
                'handlers': ['console', 'file'],
                'propagate': False
            },
            'app.services.static_order_service': {
                'level': 'DEBUG',
                'handlers': ['console', 'file'],
                'propagate': False
            }
        }
    }

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # 允许额外的字段

        @classmethod
        def customise_sources(
            cls,
            init_settings,
            env_settings,
            file_secret_settings,
        ):
            def get_database_url():
                if ENV == "production":
                    # Railway 生产环境
                    db_url = os.getenv("DATABASE_URL", "")
                    if db_url.startswith("postgres://"):
                        db_url = db_url.replace("postgres://", "postgresql://")
                    return {"DATABASE_URL": db_url}
                else:
                    # 开发环境使用 SQLite
                    return {"DATABASE_URL": f"sqlite:///{BASE_DIR}/app.db"}

            return (
                init_settings,
                get_database_url,
                env_settings,
                file_secret_settings,
            )

settings = Settings()

# 配置日志
logging.config.dictConfig(settings.LOGGING_CONFIG) 