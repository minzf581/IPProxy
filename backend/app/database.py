from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from passlib.hash import bcrypt

# 获取当前文件所在目录
current_dir = os.path.dirname(os.path.abspath(__file__))

# 使用相对路径构建数据库URL
DATABASE_URL = f"sqlite:///{os.path.join(current_dir, '..', 'app.db')}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """初始化数据库"""
    from app.models.base import Base
    from app.models.user import User
    from app.models.agent import Agent
    from app.models.resource_type import ResourceType
    from app.models.resource_usage import ResourceUsageStatistics, ResourceUsageHistory
    
    Base.metadata.create_all(bind=engine)

def init_test_data():
    """Initialize test data."""
    db = SessionLocal()
    try:
        # Check if test agent exists
        test_agent = db.query(Agent).filter_by(username="test_agent").first()
        if not test_agent:
            test_agent = Agent(
                username="test_agent",
                password=bcrypt.hash("test123"),
                email="agent@example.com",
                balance=1000.00,
                status='active'
            )
            db.add(test_agent)
            db.commit()
            db.refresh(test_agent)

        # Check if test user exists
        test_user = db.query(User).filter_by(username="test_user").first()
        if not test_user:
            test_user = User(
                username="test_user",
                password=bcrypt.hash("test123"),
                email="user@example.com",
                agent_id=test_agent.id,
                status='active',
                balance=500.00  # 添加测试用户余额
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        # Initialize resource types if not exist
        init_resource_types(db)

    except Exception as e:
        print(f"Error initializing test data: {e}")
        db.rollback()
    finally:
        db.close()

# 依赖项
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
