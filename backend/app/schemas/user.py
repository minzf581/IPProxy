from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, List, Any
from datetime import datetime
from decimal import Decimal

class UserBase(BaseModel):
    """用户基础信息"""
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r'^\d{11}$')
    remark: Optional[str] = None
    is_agent: Optional[bool] = False
    balance: Optional[float] = Field(default=0, ge=0)  # 添加余额字段，必须大于等于0

class UserCreate(UserBase):
    """创建用户时的数据结构"""
    password: str = Field(..., min_length=6, max_length=50)
    is_agent: bool = False
    agent_id: Optional[int] = None
    auth_type: Optional[int] = Field(None, ge=1, le=3)  # 1=未实名 2=个人实名 3=企业实名
    auth_name: Optional[str] = None
    no: Optional[str] = None  # 证件号码

    @validator('auth_type')
    def validate_auth_type(cls, v, values):
        """验证认证类型"""
        if v is not None and values.get('is_agent') and not values.get('auth_name'):
            raise ValueError('代理商必须提供认证名称')
        return v

class UserLogin(BaseModel):
    """用户登录时的数据结构"""
    username: str
    password: str

class UserResponse(UserBase):
    """返回给前端的用户信息"""
    id: int
    status: int
    is_admin: bool = False
    is_agent: bool = False
    balance: float = 0.0
    agent_id: Optional[int] = None
    ipipv_username: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserInDB(UserBase):
    """数据库中的用户信息"""
    id: int
    password: str
    status: int = 1
    is_admin: bool = False
    is_agent: bool = False
    balance: float = 0.0
    agent_id: Optional[int] = None
    ipipv_username: Optional[str] = None
    ipipv_password: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    """更新用户信息时的数据结构"""
    email: Optional[str] = None
    password: Optional[str] = None
    app_username: Optional[str] = None
    remark: Optional[str] = None

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    """用户列表响应"""
    list: List[UserResponse]
    total: int

    class Config:
        from_attributes = True

class UserInDBBase(UserBase):
    id: int
    balance: float
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

# 余额调整请求模型
class BalanceAdjust(BaseModel):
    amount: float = Field(..., description="调整金额")
    remark: str = Field(..., description="调整备注") 