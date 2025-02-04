from pydantic import BaseModel
from typing import List, Optional

class AreaResponse(BaseModel):
    """区域响应模型"""
    code: str
    name: Optional[str] = None
    cname: str
    children: Optional[List['AreaResponse']] = []

    class Config:
        from_attributes = True

class CountryResponse(BaseModel):
    """国家响应模型"""
    code: str
    name: str
    cname: str

    class Config:
        from_attributes = True

class CityResponse(BaseModel):
    """城市响应模型"""
    code: str
    name: str
    cname: str

    class Config:
        from_attributes = True 