from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class AgentBase(BaseModel):
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[int] = 1
    remark: Optional[str] = None

class AgentCreate(AgentBase):
    password: str

class AgentUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[int] = None
    remark: Optional[str] = None
    password: Optional[str] = None

class Agent(AgentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    balance: float = 0.0
    is_agent: bool = True

    class Config:
        from_attributes = True

class AgentList(BaseModel):
    total: int
    list: List[Agent]
    page: int
    pageSize: int 