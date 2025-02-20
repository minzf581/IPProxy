"""
区域模型模块
==========

此模块定义了区域相关的数据库模型。
已迁移到 area.py，此文件仅保留 RegionResponse 模型用于API响应。
"""

from typing import List
from pydantic import BaseModel

class RegionResponse(BaseModel):
    """区域响应模型"""
    code: str
    name: str
    cname: str
    children: List["RegionResponse"] = []

RegionResponse.model_rebuild()  # 用于处理自引用类型 