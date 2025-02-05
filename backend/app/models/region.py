from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class Region(Base):
    __tablename__ = "regions"

    code = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    status = Column(Integer, default=1)  # 1=正常 0=禁用
    
    # 缓存控制字段
    last_sync_at = Column(DateTime, default=datetime.utcnow)  # 最后同步时间
    sync_status = Column(String(20), default='pending')  # pending, syncing, success, failed
    error_count = Column(Integer, default=0)  # 错误计数
    next_sync_at = Column(DateTime)  # 下次同步时间

    # 关联关系
    countries = relationship("Country", back_populates="region")

class Country(Base):
    __tablename__ = "countries"

    code = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    region_code = Column(String(50), ForeignKey("regions.code"))
    status = Column(Integer, default=1)  # 1=正常 0=禁用

    # 缓存控制字段
    last_sync_at = Column(DateTime, default=datetime.utcnow)  # 最后同步时间
    sync_status = Column(String(20), default='pending')  # pending, syncing, success, failed
    error_count = Column(Integer, default=0)  # 错误计数
    next_sync_at = Column(DateTime)  # 下次同步时间

    # 关联关系
    region = relationship("Region", back_populates="countries")
    cities = relationship("City", back_populates="country")

class City(Base):
    __tablename__ = "cities"

    code = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    country_code = Column(String(50), ForeignKey("countries.code"))
    status = Column(Integer, default=1)  # 1=正常 0=禁用

    # 缓存控制字段
    last_sync_at = Column(DateTime, default=datetime.utcnow)  # 最后同步时间
    sync_status = Column(String(20), default='pending')  # pending, syncing, success, failed
    error_count = Column(Integer, default=0)  # 错误计数
    next_sync_at = Column(DateTime)  # 下次同步时间

    # 关联关系
    country = relationship("Country", back_populates="cities")

class RegionResponse(BaseModel):
    """区域响应模型"""
    code: str
    name: str
    cname: str
    children: List["RegionResponse"] = []

RegionResponse.model_rebuild()  # 用于处理自引用类型 