"""
区域模型模块
==========

此模块定义了区域相关的数据库模型。
"""

from sqlalchemy import Column, Integer, String, DateTime, func
from app.db.base_class import Base

class Area(Base):
    """区域模型"""
    __tablename__ = "areas"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False, comment="区域名称")
    code = Column(String(50), nullable=False, unique=True, comment="区域代码")
    description = Column(String(200), nullable=True, comment="区域描述")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间") 