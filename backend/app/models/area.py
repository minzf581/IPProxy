"""
区域模型模块
==========

此模块定义了区域相关的数据库模型。
"""

from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Area(Base):
    """区域模型"""
    __tablename__ = "areas"
    
    id = Column(Integer, primary_key=True, index=True)
    area_code = Column(String(50), unique=True, index=True)
    area_name = Column(String(100))
    enable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    countries = relationship("Country", back_populates="area", cascade="all, delete-orphan")

class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    country_code = Column(String(50), unique=True, index=True)
    country_name = Column(String(100))
    area_id = Column(Integer, ForeignKey("areas.id"))
    enable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    area = relationship("Area", back_populates="countries")
    states = relationship("State", back_populates="country", cascade="all, delete-orphan")
    cities = relationship("City", back_populates="country", cascade="all, delete-orphan")

class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    state_code = Column(String(50), index=True)
    state_name = Column(String(100))
    country_id = Column(Integer, ForeignKey("countries.id"))
    enable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    country = relationship("Country", back_populates="states")

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    city_code = Column(String(50), index=True)
    city_name = Column(String(100))
    country_id = Column(Integer, ForeignKey("countries.id"))
    enable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    country = relationship("Country", back_populates="cities") 