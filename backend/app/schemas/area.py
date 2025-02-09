"""
区域 Schema 模块
==============

此模块定义了区域相关的 Pydantic 模型，用于数据验证和序列化。
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AreaBase(BaseModel):
    """区域基础 Schema"""
    name: str = Field(..., description="区域名称", max_length=50)
    code: str = Field(..., description="区域代码", max_length=50)
    description: Optional[str] = Field(None, description="区域描述", max_length=200)

class AreaCreate(AreaBase):
    """创建区域时使用的 Schema"""
    pass

class AreaUpdate(BaseModel):
    """更新区域时使用的 Schema"""
    name: Optional[str] = Field(None, description="区域名称", max_length=50)
    code: Optional[str] = Field(None, description="区域代码", max_length=50)
    description: Optional[str] = Field(None, description="区域描述", max_length=200)

class Area(AreaBase):
    """返回区域信息时使用的 Schema"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 