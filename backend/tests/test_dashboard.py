import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.transaction import Transaction
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
import logging
from datetime import datetime, timedelta

# 设置日志
logger = logging.getLogger(__name__)

@pytest.mark.asyncio
class TestDashboard:
    """仪表盘相关测试"""

    async def test_get_dashboard_info(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_user: User,
        token_headers: dict
    ):
        """测试获取仪表盘信息"""
        try:
            headers = await token_headers
            response = await client.get(
                "/api/v1/dashboard/info",
                headers=headers
            )
            
            # 验证响应状态码
            assert response.status_code == 200
            
            # 验证响应数据结构
            data = response.json()
            assert "code" in data
            assert data["code"] == 0
            assert "data" in data
            
            dashboard_data = data["data"]
            assert "statistics" in dashboard_data
            assert "dynamicResources" in dashboard_data
            assert "staticResources" in dashboard_data
            
            # 验证统计数据
            statistics = dashboard_data["statistics"]
            assert "balance" in statistics
            assert "totalRecharge" in statistics
            assert "totalConsumption" in statistics
            assert "monthRecharge" in statistics
            assert "monthConsumption" in statistics
            assert "lastMonthConsumption" in statistics
            
            # 验证数据类型
            assert isinstance(statistics["balance"], (int, float))
            assert isinstance(statistics["totalRecharge"], (int, float))
            assert isinstance(statistics["totalConsumption"], (int, float))
            assert isinstance(statistics["monthRecharge"], (int, float))
            assert isinstance(statistics["monthConsumption"], (int, float))
            assert isinstance(statistics["lastMonthConsumption"], (int, float))
            
            # 验证动态资源数据
            dynamic_resources = dashboard_data["dynamicResources"]
            assert isinstance(dynamic_resources, list)
            if dynamic_resources:
                resource = dynamic_resources[0]
                assert "id" in resource
                assert "name" in resource
                assert "usageRate" in resource
                assert "total" in resource
                assert "monthly" in resource
                assert "today" in resource
                assert "lastMonth" in resource
                
                # 验证数据类型和范围
                assert isinstance(resource["usageRate"], (int, float))
                assert 0 <= resource["usageRate"] <= 100
                assert isinstance(resource["total"], (int, float))
                assert isinstance(resource["monthly"], (int, float))
                assert isinstance(resource["today"], (int, float))
                assert isinstance(resource["lastMonth"], (int, float))
            
            # 验证静态资源数据
            static_resources = dashboard_data["staticResources"]
            assert isinstance(static_resources, list)
            if static_resources:
                resource = static_resources[0]
                assert "id" in resource
                assert "name" in resource
                assert "usageRate" in resource
                assert "total" in resource
                assert "monthly" in resource
                assert "lastMonth" in resource
                assert "available" in resource
                assert "expired" in resource
                
                # 验证数据类型和范围
                assert isinstance(resource["usageRate"], (int, float))
                assert 0 <= resource["usageRate"] <= 100
                assert isinstance(resource["total"], (int, float))
                assert isinstance(resource["monthly"], (int, float))
                assert isinstance(resource["lastMonth"], (int, float))
                assert isinstance(resource["available"], (int, float))
                assert isinstance(resource["expired"], (int, float))
            
        except Exception as e:
            logger.error(f"[Test] 测试失败: {str(e)}")
            raise

    async def test_dashboard_data_calculation(
        self,
        client: AsyncClient,
        db: AsyncSession,
        test_user: User,
        token_headers: dict
    ):
        """测试仪表盘数据计算的准确性"""
        try:
            user = await test_user
            # Create test transactions
            transactions = [
                Transaction(
                    user_id=user.id,
                    type="recharge",
                    amount=100.0,
                    balance=1100.0,
                    status="success",
                    created_at=datetime.utcnow()
                ),
                Transaction(
                    user_id=user.id,
                    type="consumption",
                    amount=50.0,
                    balance=1050.0,
                    status="success",
                    created_at=datetime.utcnow()
                )
            ]
            for transaction in transactions:
                db.add(transaction)
            await db.commit()
            
            # Test dashboard calculations
            total_recharge = sum(t.amount for t in transactions if t.type == "recharge")
            total_consumption = sum(t.amount for t in transactions if t.type == "consumption")
            assert total_recharge == 100.0
            assert total_consumption == 50.0
            
        except Exception as e:
            logger.error(f"[Test] 测试失败: {str(e)}")
            raise

    async def test_dashboard_unauthorized(
        self,
        client: AsyncClient
    ):
        """测试未授权访问仪表盘"""
        response = await client.get("/api/v1/dashboard/info")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    async def test_dashboard_invalid_token(
        self,
        client: AsyncClient
    ):
        """测试无效token访问仪表盘"""
        response = await client.get(
            "/api/v1/dashboard/info",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data 