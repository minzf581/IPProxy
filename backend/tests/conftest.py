import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient
import pytest_asyncio
import uuid
from datetime import datetime, timedelta

from app.database import Base, get_db
from app.main import app
from app.utils.auth import create_access_token, get_password_hash
from app.models.user import User
from app.models.dashboard import ProxyInfo
from app.models.resource_usage import ResourceUsageStatistics
from app.models.static_order import StaticOrder
from app.models.transaction import Transaction
from tests.mocks.ipproxy_api import MockIPIPVAPI

# 使用SQLite内存数据库进行测试
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建测试数据库表
Base.metadata.create_all(bind=engine)

def override_get_db():
    """重写get_db函数，使用测试数据库"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# 替换依赖
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def test_db():
    """创建测试数据库会话"""
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    TestingSessionLocal = sessionmaker(bind=engine)
    
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_agent_token(test_db):
    """创建测试代理商用户并生成访问令牌"""
    # 生成唯一的用户名
    username = f"test_agent_fixture_{uuid.uuid4().hex[:8]}"
    
    # 创建代理商用户
    agent = User(
        username=username,
        password=get_password_hash("test123"),
        email=f"{username}@example.com",
        is_agent=True,
        status="active",
        balance=1000.0,
        remark="测试代理商"
    )
    test_db.add(agent)
    test_db.commit()  # 提交事务
    test_db.refresh(agent)  # 刷新对象
    
    # 生成访问令牌
    access_token = create_access_token({"sub": str(agent.id)})
    
    return {
        "token": access_token,
        "user_id": str(agent.id),
        "username": username
    }

@pytest.fixture
def test_user_token(test_db, test_agent_token):
    """创建测试普通用户并生成访问令牌"""
    # 生成唯一的用户名
    username = f"test_user_{uuid.uuid4().hex[:8]}"
    
    # 创建普通用户
    user = User(
        username=username,
        password=get_password_hash("test123"),
        email=f"{username}@example.com",
        is_agent=False,
        status="active",
        balance=500.0,
        agent_id=int(test_agent_token["user_id"])  # 关联到代理商
    )
    test_db.add(user)
    test_db.commit()  # 提交事务
    test_db.refresh(user)  # 刷新对象
    
    # 生成访问令牌
    access_token = create_access_token({"sub": str(user.id)})
    
    return {
        "token": access_token,
        "user_id": str(user.id),
        "username": username
    }

@pytest.fixture(autouse=True)
def setup_test_database():
    """每个测试前重置数据库"""
    Base.metadata.drop_all(bind=engine)  # 先删除所有表
    Base.metadata.create_all(bind=engine)  # 重新创建所有表
    
    # 初始化测试数据
    db = TestingSessionLocal()
    try:
        # 1. 创建管理员用户
        admin = User(
            id=100,
            username="admin",
            password=get_password_hash("admin123"),
            email="admin@example.com",
            is_admin=True,
            status="active",
            balance=10000.0
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        # 2. 创建测试代理商
        agent1 = User(
            id=101,
            username="agent1",
            password=get_password_hash("agent123"),
            email="agent1@example.com",
            is_agent=True,
            status="active",
            balance=5000.0,
            remark="测试代理商1"
        )
        agent2 = User(
            id=102,
            username="agent2",
            password=get_password_hash("agent123"),
            email="agent2@example.com",
            is_agent=True,
            status="disabled",
            balance=3000.0,
            remark="测试代理商2"
        )
        db.add_all([agent1, agent2])
        db.commit()
        db.refresh(agent1)
        db.refresh(agent2)
        
        # 3. 创建普通用户
        user1 = User(
            id=103,
            username="user1",
            password=get_password_hash("user123"),
            email="user1@example.com",
            is_agent=False,
            status="active",
            balance=1000.0,
            agent_id=agent1.id  # 使用实际的agent_id
        )
        user2 = User(
            id=104,
            username="user2",
            password=get_password_hash("user123"),
            email="user2@example.com",
            is_agent=False,
            status="active",
            balance=500.0,
            agent_id=agent1.id  # 使用实际的agent_id
        )
        user3 = User(
            id=105,
            username="user3",
            password=get_password_hash("user123"),
            email="user3@example.com",
            is_agent=False,
            status="disabled",
            balance=0.0,
            agent_id=agent2.id  # 使用实际的agent_id
        )
        db.add_all([user1, user2, user3])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        db.refresh(user3)
        
        # 4. 创建代理服务器信息
        proxy_info = ProxyInfo(
            balance=10000.0,
            total_recharge=15000.0,
            total_consumption=5000.0,
            month_recharge=2000.0,
            month_consumption=1000.0,
            last_month_consumption=1500.0
        )
        db.add(proxy_info)
        
        # 5. 创建资源使用统计
        usage_stats = ResourceUsageStatistics(
            resource_type_id=1,  # 假设资源类型ID为1
            total_openings=100,
            monthly_openings=20,
            available_count=80,
            expired_count=20
        )
        db.add(usage_stats)
        
        # 6. 创建静态代理订单记录
        order1 = StaticOrder(
            order_no="ORD202401010001",
            app_order_no="IPIPV202401010001",
            user_id=user1.id,
            agent_id=agent1.id,
            product_no="STATIC001",
            proxy_type=1,
            region_code="AS",
            country_code="CN",
            city_code="SZ",
            static_type="residential",
            ip_count=1,
            duration=30,
            unit=1,
            amount=100.0,
            status="completed",
            remark="测试订单1"
        )
        order2 = StaticOrder(
            order_no="ORD202401010002",
            app_order_no="IPIPV202401010002",
            user_id=user2.id,
            agent_id=agent1.id,
            product_no="STATIC002",
            proxy_type=1,
            region_code="EU",
            country_code="DE",
            city_code="BER",
            static_type="datacenter",
            ip_count=1,
            duration=60,
            unit=1,
            amount=200.0,
            status="pending",
            remark="测试订单2"
        )
        db.add_all([order1, order2])
        
        # 7. 创建交易记录
        transaction1 = Transaction(
            transaction_no="TRX202401010001",
            order_no="TRX202401010001",
            user_id=user1.id,
            agent_id=agent1.id,
            amount=100.0,
            balance=1000.0,  # 交易后的余额
            type="recharge",
            status="completed",
            remark="充值"
        )
        transaction2 = Transaction(
            transaction_no="TRX202401010002",
            order_no="TRX202401010002",
            user_id=user2.id,
            agent_id=agent1.id,
            amount=50.0,
            balance=450.0,  # 交易后的余额
            type="consumption",
            status="completed",
            remark="消费"
        )
        db.add_all([transaction1, transaction2])
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)  # 测试结束后清理

@pytest.fixture(scope="session")
def test_env():
    """设置测试环境变量"""
    # 设置测试环境的环境变量
    os.environ["APP_ID"] = "test_app_id"
    os.environ["APP_KEY"] = "test_app_key"
    os.environ["SECRET_KEY"] = "test_secret_key"
    os.environ["TESTING"] = "true"
    yield
    # 清理环境变量
    del os.environ["APP_ID"]
    del os.environ["APP_KEY"]
    del os.environ["SECRET_KEY"]
    del os.environ["TESTING"]

@pytest_asyncio.fixture
async def client():
    """创建测试客户端"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
        await ac.aclose()

@pytest.fixture(scope="function")
def db_session():
    """创建数据库会话"""
    Base.metadata.drop_all(bind=engine)  # 先删除所有表
    Base.metadata.create_all(bind=engine)  # 重新创建所有表
    
    session = TestingSessionLocal()
    try:
        # 初始化测试数据
        # 1. 创建管理员用户
        admin = User(
            id=100,
            username="admin",
            password=get_password_hash("admin123"),
            email="admin@example.com",
            is_admin=True,
            status="active",
            balance=10000.0
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        
        # 2. 创建测试代理商
        agent1 = User(
            id=101,
            username="agent1",
            password=get_password_hash("agent123"),
            email="agent1@example.com",
            is_agent=True,
            status="active",
            balance=5000.0,
            remark="测试代理商1"
        )
        agent2 = User(
            id=102,
            username="agent2",
            password=get_password_hash("agent123"),
            email="agent2@example.com",
            is_agent=True,
            status="disabled",
            balance=3000.0,
            remark="测试代理商2"
        )
        session.add_all([agent1, agent2])
        session.commit()
        session.refresh(agent1)
        session.refresh(agent2)
        
        # 3. 创建普通用户
        user1 = User(
            id=103,
            username="user1",
            password=get_password_hash("user123"),
            email="user1@example.com",
            is_agent=False,
            status="active",
            balance=1000.0,
            agent_id=agent1.id
        )
        user2 = User(
            id=104,
            username="user2",
            password=get_password_hash("user123"),
            email="user2@example.com",
            is_agent=False,
            status="active",
            balance=500.0,
            agent_id=agent1.id
        )
        user3 = User(
            id=105,
            username="user3",
            password=get_password_hash("user123"),
            email="user3@example.com",
            is_agent=False,
            status="disabled",
            balance=0.0,
            agent_id=agent2.id
        )
        session.add_all([user1, user2, user3])
        session.commit()
        session.refresh(user1)
        session.refresh(user2)
        session.refresh(user3)
        
        yield session
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)  # 测试结束后清理 

@pytest.fixture
def mock_ipproxy_api():
    """创建并设置Mock API"""
    mock_api = MockIPIPVAPI()
    return mock_api 