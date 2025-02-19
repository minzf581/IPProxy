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

class Settings(BaseSettings):
    PROJECT_NAME: str = "IP Proxy Management System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/app.db"
    
    # IPIPV API 配置
    IPIPV_API_BASE_URL: str = "https://sandbox.ipipv.com"
    IPIPV_API_KEY: str = "AK20241120145620"
    IPIPV_API_SECRET: str = "bf3ffghlt0hpc4omnvc2583jt0fag6a4"
    
    # 认证信息配置
    IPIPV_MAIN_AUTH_TYPE: int = 1
    IPIPV_MAIN_AUTH_NAME: str = "测试公司"
    IPIPV_MAIN_AUTH_NO: str = "3101112"
    IPIPV_MAIN_PHONE: str = "13800138000"
    IPIPV_MAIN_EMAIL: str = "test1006@test.com"
    
    # API配置
    API_BASE_URL: str = "https://sandbox.ipipv.com"
    API_KEY: str = "AK20241120145620"
    API_SECRET: str = "bf3ffghlt0hpc4omnvc2583jt0fag6a4"
    
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

settings = Settings()

# 配置日志
logging.config.dictConfig(settings.LOGGING_CONFIG) 