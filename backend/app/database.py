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

# 获取当前文件所在目录
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 数据库文件路径
DB_FILE = os.path.join(BASE_DIR, "app.db")

# 数据库URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"

# 创建数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=3,
    max_overflow=5,
    pool_timeout=10,
    pool_recycle=300,
    pool_pre_ping=True
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
