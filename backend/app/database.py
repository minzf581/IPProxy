from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.core.config import settings
import os
import logging
import traceback
from app.models.base import Base, TimestampMixin
from tenacity import retry, stop_after_attempt, wait_exponential
from sqlalchemy.exc import OperationalError, TimeoutError

logger = logging.getLogger(__name__)

# 创建数据库引擎
def get_engine_config():
    """获取数据库引擎配置"""
    config = {
        "pool_pre_ping": True,
        "pool_size": 5,        # 最小连接池大小
        "max_overflow": 10,    # 允许的最大连接数超出pool_size的数量
        "pool_timeout": 30,    # 连接池获取连接的超时时间
        "pool_recycle": 1800,  # 连接重置时间
    }
    
    if settings.ENV == "production":
        # PostgreSQL 生产环境配置
        config.update({
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
            "connect_args": {
                "check_same_thread": False,
                "timeout": 30
            }
        })
    
    return config

engine = create_engine(
    settings.DATABASE_URL,
    **get_engine_config()
)

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # 防止在提交后访问对象属性时出现过期问题
)

# 创建基类
Base = declarative_base()

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    reraise=True
)
def get_db_with_retry():
    """获取数据库会话（带重试机制）"""
    db = SessionLocal()
    try:
        # 测试连接是否有效
        db.execute("SELECT 1")
        return db
    except Exception as e:
        logger.error(f"数据库连接失败: {str(e)}")
        db.close()
        raise

def get_db():
    """获取数据库会话"""
    logger.info("尝试获取数据库会话...")
    try:
        db = get_db_with_retry()
        logger.info("成功创建数据库会话")
        try:
            yield db
        except Exception as e:
            logger.error(f"数据库会话错误: {str(e)}")
            logger.error(f"错误类型: {type(e).__name__}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            if isinstance(e, (OperationalError, TimeoutError)):
                logger.warning("检测到数据库连接问题，尝试重新连接...")
                db.close()
                db = get_db_with_retry()
            else:
                db.rollback()
            raise
        finally:
            logger.info("关闭数据库会话")
            db.close()
    except Exception as e:
        logger.error(f"获取数据库会话失败: {str(e)}")
        raise
