from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.core.config import settings
import os
import logging
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
    pool_size=5,  # 连接池大小
    max_overflow=10,  # 超出连接池大小后可以创建的最大连接数
    pool_timeout=30,  # 连接池获取连接的超时时间
    pool_recycle=1800,  # 连接在连接池中的存活时间
    pool_pre_ping=True,  # 每次连接前ping一下数据库，确保连接有效
    poolclass=QueuePool,  # 使用队列池
    connect_args={
        "connect_timeout": 10,  # 连接超时时间
        "keepalives": 1,  # 启用keepalive
        "keepalives_idle": 30,  # 空闲多久后发送keepalive
        "keepalives_interval": 10,  # keepalive的间隔
        "keepalives_count": 5  # keepalive重试次数
    }
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"数据库会话错误: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
