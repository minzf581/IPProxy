from typing import Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing" 
    SUCCESS = "success"
    FAILED = "failed"

class CreateOrderRequest(BaseModel):
    orderType: str = Field(..., description="订单类型: dynamic_proxy或static_proxy")
    poolId: str = Field(..., description="IP池ID")
    trafficAmount: Optional[int] = Field(None, description="流量数量(动态代理)")
    unitPrice: float = Field(..., description="单价")
    totalAmount: float = Field(..., description="总金额")
    remark: Optional[str] = Field(None, description="备注")
    userId: int = Field(..., description="用户ID")
    regionCode: Optional[str] = Field(None, description="区域代码")
    countryCode: Optional[str] = Field(None, description="国家代码")
    cityCode: Optional[str] = Field(None, description="城市代码")
    staticType: Optional[str] = Field(None, description="静态代理类型")
    ipCount: Optional[int] = Field(None, description="IP数量")
    duration: Optional[int] = Field(None, description="有效期")

    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    code: int = Field(0, description="状态码")
    msg: str = Field("success", description="状态信息")
    data: Dict = Field(..., description="响应数据")

    class Config:
        from_attributes = True

class OrderDetailResponse(BaseModel):
    code: int = Field(0, description="状态码")
    msg: str = Field("success", description="状态信息")
    data: Dict = Field(..., description="订单详情")

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    proxy_type: str = Field(..., description="代理类型: dynamic或static")
    pool_id: str = Field(..., description="IP池ID")
    traffic_amount: Optional[int] = Field(None, description="流量数量(动态代理)")
    ip_count: Optional[int] = Field(None, description="IP数量(静态代理)")
    duration: Optional[int] = Field(None, description="有效期(静态代理)")
    unit_price: float = Field(..., description="单价")
    total_amount: float = Field(..., description="总金额")
    remark: Optional[str] = Field(None, description="备注")

class OrderResponse(BaseModel):
    id: str
    user_id: str
    username: str
    agent_id: Optional[str]
    proxy_type: str
    pool_id: str
    traffic_amount: Optional[int]
    ip_count: Optional[int]
    duration: Optional[int]
    unit_price: float
    total_amount: float
    status: OrderStatus
    proxy_info: Optional[Dict]
    remark: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 