from pydantic import BaseModel, condecimal, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ProductPriceBase(BaseModel):
    id: int
    type: str  # 'dynamic' | 'static'
    proxyType: int  # 代理类型 (101=静态云平台, 102=静态国内家庭, 103=静态国外家庭, 104=动态国外代理, 105=动态国内代理, 201=其他动态代理)
    area: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    ipRange: Optional[str] = None
    price: Decimal = Field(default=Decimal('0'), decimal_places=4)
    minAgentPrice: Decimal = Field(default=Decimal('0'), decimal_places=4)
    isGlobal: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    ipWhitelist: Optional[List[str]] = None  # 修改字段名为 ipWhitelist

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }
        alias_generator = lambda x: x[0].lower() + x[1:] if x else x  # 驼峰命名转换

class ProductPriceUpdate(BaseModel):
    id: int
    price: condecimal(max_digits=10, decimal_places=4)
    min_agent_price: Optional[condecimal(max_digits=10, decimal_places=4)] = None
    type: Optional[str] = None
    proxy_type: Optional[int] = None
    ip_whitelist: Optional[List[str]] = None

    class Config:
        from_attributes = True

class ProductPriceUpdateRequest(BaseModel):
    is_global: bool
    agent_id: Optional[int]
    user_id: Optional[int]
    app_username: Optional[str]
    prices: List[ProductPriceUpdate]

    class Config:
        from_attributes = True

class ProductPriceResponse(BaseModel):
    code: int = 200
    message: str = "success"
    data: List[ProductPriceBase]

    class Config:
        from_attributes = True

class ImportPriceItem(BaseModel):
    product_id: str
    type: str
    proxy_type: int
    price: condecimal(max_digits=10, decimal_places=1)
    min_agent_price: condecimal(max_digits=10, decimal_places=1)
    is_global: bool = True

    class Config:
        from_attributes = True

class BatchImportRequest(BaseModel):
    prices: List[ImportPriceItem]

    class Config:
        from_attributes = True

class ImportResult(BaseModel):
    total: int
    success: int
    failed: int

    class Config:
        from_attributes = True 