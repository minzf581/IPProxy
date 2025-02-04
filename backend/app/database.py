from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from passlib.hash import bcrypt

# 创建 Base 类
Base = declarative_base()

# 获取当前文件所在目录
current_dir = os.path.dirname(os.path.abspath(__file__))

# 使用相对路径构建数据库URL
DATABASE_URL = f"sqlite:///{os.path.join(current_dir, '..', 'app.db')}"

# 创建引擎
engine = create_engine(DATABASE_URL)

# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

async def init_db():
    """初始化数据库"""
    from app.models.base import Base
    from app.models import User, Transaction, ResourceType, ResourceUsageStatistics, ResourceUsageHistory, ProxyInfo, AgentPrice
    Base.metadata.create_all(bind=engine)

async def init_test_data():
    """Initialize test data."""
    from app.models import User, AgentPrice
    from decimal import Decimal
    db = SessionLocal()
    try:
        # 检查并创建管理员账户
        admin = db.query(User).filter_by(username="admin").first()
        if not admin:
            admin = User(
                username="admin",
                password="admin123",
                email="admin@example.com",
                is_admin=True,
                is_agent=False,
                status='active'
            )
            db.add(admin)
            db.commit()
            
        # 检查并创建代理商价格配置
        agent_price = db.query(AgentPrice).first()
        if not agent_price:
            agent_price = AgentPrice(
                proxy_type=103,  # 静态国外家庭
                unit_price=Decimal('0.1'),  # 每IP每天0.1元
                min_quantity=1,
                max_quantity=1000,
                status='active'
            )
            db.add(agent_price)
            db.commit()
            
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
