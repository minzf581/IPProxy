from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.core.config import settings
import os
import logging
import traceback
from app.models.base import Base, TimestampMixin

logger = logging.getLogger(__name__)

# 创建数据库引擎
def get_engine_config():
    """获取数据库引擎配置"""
    config = {
        "pool_pre_ping": True,
    }
    
    if settings.ENV == "production":
        # PostgreSQL 生产环境配置
        config.update({
            "pool_size": 5,
            "max_overflow": 10,
            "pool_timeout": 30,
            "pool_recycle": 1800,
            "connect_args": {
                "connect_timeout": 10,
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5
            }
        })
    else:
        # SQLite 开发环境配置
        config.update({
            "pool_size": 1,
            "max_overflow": 0,
            "connect_args": {"check_same_thread": False}
        })
    
    return config

engine = create_engine(
    settings.DATABASE_URL,
    **get_engine_config()
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

def get_db():
    """获取数据库会话"""
    logger.info("尝试获取数据库会话...")
    db = SessionLocal()
    try:
        logger.info("成功创建数据库会话")
        yield db
    except Exception as e:
        logger.error(f"数据库会话错误: {str(e)}")
        logger.error(f"错误类型: {type(e).__name__}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        db.rollback()
        raise
    finally:
        logger.info("关闭数据库会话")
        db.close()
