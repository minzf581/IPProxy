from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """用户基础信息"""
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    """创建用户时的数据结构"""
    password: str

class UserLogin(BaseModel):
    """用户登录时的数据结构"""
    username: str
    password: str

class UserResponse(UserBase):
    """返回给前端的用户信息"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserInDB(UserBase):
    """数据库中的用户信息"""
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 