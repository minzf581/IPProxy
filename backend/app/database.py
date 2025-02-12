from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import logging
from app.models.base import Base, TimestampMixin

# 获取当前文件所在目录
current_dir = os.path.dirname(os.path.abspath(__file__))

# 使用相对路径构建数据库URL
DATABASE_URL = f"sqlite:///{os.path.join(current_dir, '..', 'app.db')}"

# 创建引擎
engine = create_engine(DATABASE_URL)

# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
