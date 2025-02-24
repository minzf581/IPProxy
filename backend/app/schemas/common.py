from pydantic import BaseModel
from typing import Optional, Any, Dict, List

class Response(BaseModel):
    """通用响应模型"""
    code: int = 0
    message: str = "success"
    data: Optional[Any] = None

class PaginatedResponse(BaseModel):
    """分页响应模型"""
    code: int = 0
    message: str = "success"
    data: Dict[str, Any] = {
        "list": [],
        "total": 0,
        "page": 1,
        "pageSize": 10
    }

class ErrorResponse(BaseModel):
    """错误响应模型"""
    code: int
    message: str 