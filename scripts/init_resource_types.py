from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.resource_type import ResourceType
from datetime import datetime

def init_resource_types(db: Session):
    """初始化资源类型数据"""
    
    # 检查并创建资源类型
    resource_types = [
        {
            "name": "static1",
            "description": "静态资源1",
            "price": 100.00,
            "status": "active"
        },
        {
            "name": "static2",
            "description": "静态资源2",
            "price": 200.00,
            "status": "active"
        },
        {
            "name": "dynamic1",
            "description": "动态资源1",
            "price": 50.00,
            "status": "active"
        },
        {
            "name": "dynamic2",
            "description": "动态资源2",
            "price": 80.00,
            "status": "active"
        }
    ]
    
    for rt_data in resource_types:
        rt = db.query(ResourceType).filter(ResourceType.name == rt_data["name"]).first()
        if not rt:
            rt = ResourceType(**rt_data)
            db.add(rt)
    
    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_resource_types(db)
    finally:
        db.close() 