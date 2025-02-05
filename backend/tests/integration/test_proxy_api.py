import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import get_db, Base, engine
from app.models.dashboard import ProxyInfo
from app.models.transaction import FlowUsage

# 创建测试客户端
client = TestClient(app)

@pytest.fixture(scope="module")
def test_db():
    """创建测试数据库"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    # 返回数据库会话
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()
        # 清理数据库
        Base.metadata.drop_all(bind=engine)

def test_get_proxy_info(test_db: Session):
    """测试获取代理信息"""
    # 创建测试数据
    proxy_info = ProxyInfo(
        balance=1000.0,
        total_recharge=5000.0,
        total_consumption=4000.0,
        month_recharge=500.0,
        month_consumption=300.0,
        last_month_consumption=800.0
    )
    test_db.add(proxy_info)
    test_db.commit()
    
    # 发送请求
    response = client.get("/api/open/app/proxy/info/v2")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "200"
    assert data["msg"] == "success"
    assert data["data"]["balance"] == 1000.0
    assert data["data"]["totalRecharge"] == 5000.0
    assert data["data"]["totalConsumption"] == 4000.0
    assert data["data"]["monthRecharge"] == 500.0
    assert data["data"]["monthConsumption"] == 300.0
    assert data["data"]["lastMonthConsumption"] == 800.0

def test_get_flow_usage(test_db: Session):
    """测试获取流量使用记录"""
    # 创建测试数据
    flow_usage = FlowUsage(
        monthly_usage=150.5,
        daily_usage=5.2,
        last_month_usage=200.8
    )
    test_db.add(flow_usage)
    test_db.commit()
    
    # 发送请求
    response = client.get("/api/open/app/proxy/flow/use/log/v2")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "200"
    assert data["msg"] == "success"
    assert data["data"]["monthlyUsage"] == 150.5
    assert data["data"]["dailyUsage"] == 5.2
    assert data["data"]["lastMonthUsage"] == 200.8 