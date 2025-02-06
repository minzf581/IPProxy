"""
认证测试模块
==========

此模块包含所有与用户认证相关的测试，包括：
1. 用户登录
2. 令牌验证
3. 密码管理
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, engine, Base
from app.models.user import User
from app.models.agent_price import AgentPrice
from sqlalchemy.orm import Session
from decimal import Decimal
from passlib.hash import bcrypt

client = TestClient(app)

@pytest.fixture(scope="module")
def test_db():
    """创建测试数据库"""
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    
    # 创建测试用户
    admin = User(
        username="admin",
        password=bcrypt.hash("admin123"),
        email="admin@example.com",
        is_admin=True,
        is_agent=False,
        status=1,
        balance=1000.0
    )
    db.add(admin)
    db.commit()
    
    agent = User(
        username="agent",
        password=bcrypt.hash("agent123"),
        email="agent@example.com",
        is_admin=False,
        is_agent=True,
        status=1,
        balance=500.0
    )
    db.add(agent)
    db.commit()
    
    # 创建代理商价格配置
    agent_price = AgentPrice(
        agent_id=agent.id,
        dynamic_proxy_price=Decimal('0.1'),
        static_proxy_price=Decimal('0.2')
    )
    db.add(agent_price)
    db.commit()
    
    yield db
    
    # 清理测试数据
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_admin_login(test_db):
    """测试管理员登录"""
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 0
    assert "token" in data["data"]
    assert data["data"]["user"]["username"] == "admin"
    assert data["data"]["user"]["is_admin"] is True

def test_agent_login(test_db):
    """测试代理商登录"""
    response = client.post(
        "/api/auth/login",
        json={"username": "agent", "password": "agent123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 0
    assert "token" in data["data"]
    assert data["data"]["user"]["username"] == "agent"
    assert data["data"]["user"]["is_agent"] is True

def test_invalid_login(test_db):
    """测试无效登录"""
    response = client.post(
        "/api/auth/login",
        json={"username": "invalid", "password": "invalid"}
    )
    assert response.status_code == 401

def test_get_current_user(test_db):
    """测试获取当前用户信息"""
    # 先登录获取token
    login_response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    token = login_response.json()["data"]["token"]
    
    # 使用token获取用户信息
    response = client.get(
        "/api/auth/current-user",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 0
    assert data["data"]["username"] == "admin" 