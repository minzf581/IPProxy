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
ENV = os.getenv("RAILWAY_ENVIRONMENT", "development")  # 使用 RAILWAY_ENVIRONMENT 判断

# 创建 logger
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    PROJECT_NAME: str = "IP Proxy Management System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # 环境配置
    ENV: str = ENV
    DEBUG: bool = ENV != "production"
    
    # 数据库配置
    @property
    def DATABASE_URL(self) -> str:
        """根据环境返回对应的数据库 URL"""
        if self.ENV == "production":
            # 生产环境使用 Railway 的 PostgreSQL
            db_url = "postgresql://postgres:VklXzDrDMygoJNZjzzSlNLMjmqKIPaYQ@postgres.railway.internal:5432/railway"
        else:
            # 开发环境使用本地 SQLite
            db_url = f"sqlite:///{BASE_DIR}/app.db"
        
        logger.info(f"使用数据库 URL: {db_url} (环境: {self.ENV})")
        return db_url
    
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
            'app': {
                'handlers': ['console', 'file'],
                'level': 'DEBUG',
                'propagate': False
            }
        }
    }

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()

# 配置日志
logging.config.dictConfig(settings.LOGGING_CONFIG) 