from pydantic import BaseModel
from typing import List
from datetime import datetime

class InstanceBase(BaseModel):
    instance_no: str
    order_no: str
    user_id: int
    proxy_ip: str
    proxy_port: int
    username: str
    password: str
    expire_time: datetime
    status: int

class InstanceCreate(InstanceBase):
    pass

class Instance(InstanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    ip_whitelist: List[str] = []

    class Config:
        from_attributes = True

class InstanceResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: Instance

class WhitelistData(BaseModel):
    instance_id: int
    whitelist: List[str]

class WhitelistResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: WhitelistData 