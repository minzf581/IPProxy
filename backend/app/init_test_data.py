from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.transaction import Transaction
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from app.models.product_inventory import ProductInventory
from passlib.hash import bcrypt

def init_test_data(db: Session):
    """初始化测试数据"""
    # 检查是否已经有数据
    if db.query(User).count() > 0:
        return
        
    # 创建测试用户
    test_user = User(
        username="test_user",
        password=bcrypt.hash("test123"),
        email="test@example.com",
        status=1,
        balance=1000.00,
        is_admin=False,
        created_at=datetime.now()
    )
    db.add(test_user)
    
    # 创建测试管理员
    admin_user = User(
        username="admin",
        password=bcrypt.hash("admin123"),
        email="admin@example.com",
        status=1,
        balance=0.00,
        is_admin=True,
        created_at=datetime.now()
    )
    db.add(admin_user)
    
    db.commit()

if __name__ == "__main__":
    init_test_data() 