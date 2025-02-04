from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from typing import List, Optional
from pydantic import BaseModel

class Region(Base):
    __tablename__ = "regions"

    code = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    status = Column(Integer, default=1)  # 1=正常 0=禁用

    # 关联关系
    countries = relationship("Country", back_populates="region")

class Country(Base):
    __tablename__ = "countries"

    code = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    region_code = Column(String(50), ForeignKey("regions.code"))
    status = Column(Integer, default=1)  # 1=正常 0=禁用

    # 关联关系
    region = relationship("Region", back_populates="countries")
    cities = relationship("City", back_populates="country")

class City(Base):
    __tablename__ = "cities"

    code = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    country_code = Column(String(50), ForeignKey("countries.code"))
    status = Column(Integer, default=1)  # 1=正常 0=禁用

    # 关联关系
    country = relationship("Country", back_populates="cities")

class RegionResponse(BaseModel):
    """区域响应模型"""
    code: str
    name: str
    cname: str
    children: List["RegionResponse"] = []

RegionResponse.model_rebuild()  # 用于处理自引用类型 