import pytest
import httpx
from sqlalchemy.orm import Session
from datetime import datetime
import json
import os
from httpx import AsyncClient
from typing import AsyncGenerator

from app.main import app
from app.models.user import User
from app.models.transaction import Transaction
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from app.database import get_db
from app.services.auth import get_password_hash, create_access_token

# 创建测试客户端
@pytest.fixture
async def client():
    """创建测试客户端"""
    async with httpx.AsyncClient(base_url="http://test", transport=httpx.ASGITransport(app=app)) as client:
        yield client

# 测试数据
test_user = {
    "username": "test_user2",  # 修改用户名避免冲突
    "password": "test123",
    "email": "test2@example.com",
    "balance": 10000,  # 初始余额10000
    "status": 1  # 正常状态
}

test_agent = {
    "username": os.getenv('IPIPV_USERNAME', 'test_agent_fixture'),  # 使用环境变量或默认值
    "password": "test123",
    "email": "agent2@example.com",
    "balance": 20000,  # 初始余额20000
    "status": 1  # 正常状态
}

@pytest.fixture
def db_session():
    """创建数据库会话"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

async def anext(agen: AsyncGenerator) -> AsyncClient:
    """获取异步生成器的下一个值"""
    return await agen.__anext__()

@pytest.mark.asyncio
async def test_activate_business_dynamic(client: AsyncClient, test_agent_token, test_user_token, db_session):
    """测试开通动态代理业务"""
    # 获取客户端实例
    client = await anext(client)
    
    # 准备请求数据
    data = {
        "userId": test_user_token["user_id"],
        "username": test_agent_token["username"],  # 使用代理商的用户名
        "proxyType": "dynamic",
        "poolType": "pool1",
        "traffic": "1000",
        "total_cost": 100,
        "remark": "测试开通动态代理"
    }

    # 发送请求
    response = await client.post(
        f"/api/user/{test_user_token['user_id']}/activate-business",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"},
        json=data
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert response.json()["message"] == "业务激活成功"

@pytest.mark.asyncio
async def test_activate_business_static(client: AsyncClient, test_agent_token, test_user_token, db_session):
    """测试开通静态代理业务"""
    # 获取客户端实例
    client = await anext(client)
    
    # 准备请求数据
    data = {
        "userId": test_user_token["user_id"],
        "username": test_agent_token["username"],  # 使用代理商的用户名
        "proxyType": "static",
        "region": "中国",
        "country": "中国",
        "city": "上海",
        "staticType": "type1",
        "ipRange": "1.1.1.1/24",
        "duration": "30",
        "quantity": "10",
        "total_cost": 200,
        "remark": "测试开通静态代理"
    }

    # 发送请求
    response = await client.post(
        f"/api/user/{test_user_token['user_id']}/activate-business",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"},
        json=data
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert response.json()["message"] == "业务激活成功"

@pytest.mark.asyncio
async def test_activate_business_insufficient_balance(client: AsyncClient, test_agent_token, test_user_token, db_session):
    """测试余额不足的情况"""
    # 获取客户端实例
    client = await anext(client)
    
    # 准备请求数据（设置一个超大的金额）
    data = {
        "userId": test_user_token["user_id"],
        "username": test_agent_token["username"],  # 使用代理商的用户名
        "proxyType": "dynamic",
        "poolType": "pool1",
        "traffic": "1000",
        "total_cost": 100000,  # 超过用户余额
        "remark": "测试余额不足"
    }

    # 发送请求
    response = await client.post(
        f"/api/user/{test_user_token['user_id']}/activate-business",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"},
        json=data
    )

    # 验证响应
    assert response.status_code == 400
    assert response.json()["code"] == 400
    assert response.json()["message"] == "用户余额不足"

@pytest.mark.asyncio
async def test_activate_business_unauthorized(client: AsyncClient, test_user_token, db_session):
    """测试未授权的情况"""
    # 获取客户端实例
    client = await anext(client)
    
    # 准备请求数据
    data = {
        "userId": test_user_token["user_id"],
        "username": "test_agent",  # 使用代理商的用户名
        "proxyType": "dynamic",
        "poolType": "pool1",
        "traffic": "1000",
        "total_cost": 100,
        "remark": "测试未授权"
    }

    # 发送请求（不带token）
    response = await client.post(
        f"/api/user/{test_user_token['user_id']}/activate-business",
        json=data
    )

    # 验证响应
    assert response.status_code == 401
    assert response.json()["code"] == 401
    assert response.json()["message"] == "未授权"

@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, test_agent_token, test_user_token, db_session):
    """测试修改密码"""
    # 获取客户端实例
    client = await anext(client)
    
    # 准备请求数据
    data = {
        "password": "newpassword123"
    }

    # 发送请求
    response = await client.post(
        f"/api/user/{test_user_token['user_id']}/change-password",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"},
        json=data
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert response.json()["message"] == "密码修改成功"

@pytest.mark.asyncio
async def test_change_password_unauthorized(client: AsyncClient, test_user_token, db_session):
    """测试未授权修改密码"""
    # 获取客户端实例
    client = await anext(client)
    
    # 准备请求数据
    data = {
        "password": "newpassword123"
    }

    # 发送请求（不带token）
    response = await client.post(
        f"/api/user/{test_user_token['user_id']}/change-password",
        json=data
    )

    # 验证响应
    assert response.status_code == 401
    assert response.json()["code"] == 401
    assert "未授权" in response.json()["message"]

@pytest.mark.asyncio
async def test_update_agent_balance(client: AsyncClient, test_agent_token, db_session):
    """测试调整代理商额度"""
    # 获取客户端实例
    client = await anext(client)
    
    # 创建管理员token
    admin_token = create_access_token({"sub": "1"})  # admin的ID是1
    
    # 准备请求数据
    data = {
        "amount": 500,
        "type": "add",
        "remark": "测试增加额度"
    }

    # 发送请求
    response = await client.post(
        f"/api/agent/{test_agent_token['user_id']}/balance",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=data
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert response.json()["message"] == "额度调整成功"

@pytest.mark.asyncio
async def test_update_agent_status(client: AsyncClient, test_agent_token, db_session):
    """测试更新代理商状态"""
    # 获取客户端实例
    client = await anext(client)
    
    # 创建管理员token
    admin_token = create_access_token({"sub": "1"})  # admin的ID是1
    
    # 准备请求数据
    data = {
        "status": "disabled",  # 使用正确的状态值
        "remark": "测试停用代理商"
    }

    # 发送请求
    response = await client.post(
        f"/api/agent/{test_agent_token['user_id']}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=data
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert response.json()["message"] == "状态更新成功"

@pytest.mark.asyncio
async def test_get_agent_transactions(client: AsyncClient, test_agent_token, db_session):
    """测试获取代理商额度记录"""
    # 获取客户端实例
    client = await anext(client)
    
    # 发送请求
    response = await client.get(
        f"/api/agent/{test_agent_token['user_id']}/transactions",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"}
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert "transactions" in response.json()["data"]

@pytest.mark.asyncio
async def test_get_agent_detail(client: AsyncClient, test_agent_token, db_session):
    """测试获取代理商详情"""
    # 获取客户端实例
    client = await anext(client)
    
    # 发送请求
    response = await client.get(
        f"/api/agent/{test_agent_token['user_id']}/detail",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"}
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert "agent" in response.json()["data"]

@pytest.mark.asyncio
async def test_get_agent_statistics(client: AsyncClient, test_agent_token, db_session):
    """测试获取代理商统计信息"""
    # 获取客户端实例
    client = await anext(client)
    
    # 发送请求
    response = await client.get(
        f"/api/agent/{test_agent_token['user_id']}/statistics",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"}
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert "statistics" in response.json()["data"]

@pytest.mark.asyncio
async def test_renew_dynamic_proxy(client: AsyncClient, test_agent_token, test_user_token, db_session):
    """测试动态代理续费"""
    # 获取客户端实例
    client = await anext(client)
    
    # 准备请求数据
    data = {
        "userId": test_user_token["user_id"],
        "username": test_agent_token["username"],  # 使用代理商的用户名
        "proxyType": "dynamic",
        "poolType": "pool1",
        "traffic": "1000",
        "total_cost": 100,
        "remark": "测试动态代理续费"
    }

    # 发送请求
    response = await client.post(
        f"/api/user/{test_user_token['user_id']}/renew",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"},
        json=data
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert response.json()["message"] == "续费成功"

@pytest.mark.asyncio
async def test_renew_static_proxy(client: AsyncClient, test_agent_token, test_user_token, db_session):
    """测试静态代理续费"""
    # 获取客户端实例
    client = await anext(client)
    
    # 准备请求数据
    data = {
        "userId": test_user_token["user_id"],
        "username": test_agent_token["username"],  # 使用代理商的用户名
        "proxyType": "static",
        "region": "中国",
        "country": "中国",
        "city": "上海",
        "staticType": "type1",
        "ipRange": "1.1.1.1/24",
        "duration": "30",
        "quantity": "10",
        "total_cost": 200,
        "remark": "测试静态代理续费"
    }

    # 发送请求
    response = await client.post(
        f"/api/user/{test_user_token['user_id']}/renew",
        headers={"Authorization": f"Bearer {test_agent_token['token']}"},
        json=data
    )

    # 验证响应
    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert response.json()["message"] == "续费成功" 