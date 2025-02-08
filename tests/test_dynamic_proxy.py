import pytest
from fastapi import HTTPException
from app.services.ipipv_service import IPIPVService

@pytest.fixture
def ipipv_service():
    return IPIPVService()

@pytest.mark.asyncio
class TestDynamicProxy:
    """动态代理相关测试"""

    async def test_activate_dynamic_proxy_success(self, ipipv_service: IPIPVService):
        """测试成功激活动态代理"""
        test_order_data = {
            "order_id": "test_order_1",
            "pool_id": "out_dynamic_1",  # 使用默认的动态代理产品编号
            "traffic_amount": 100,
            "duration": 30,  # 添加时长参数
            "unit": 3  # 添加单位参数，3表示按月
        }

        result = await ipipv_service.activate_dynamic_proxy(
            order_id=test_order_data["order_id"],
            pool_id=test_order_data["pool_id"],
            traffic_amount=test_order_data["traffic_amount"],
            duration=test_order_data["duration"],
            unit=test_order_data["unit"]
        )

        assert result is not None
        assert isinstance(result, dict)
        assert "order_no" in result
        assert "app_order_no" in result
        assert "status" in result
        assert result["status"] == "pending"
        assert "message" in result
        assert "amount" in result

    async def test_activate_dynamic_proxy_failure(self, ipipv_service: IPIPVService):
        """测试代理激活失败的情况"""
        with pytest.raises(HTTPException) as exc_info:
            await ipipv_service.activate_dynamic_proxy(
                order_id="invalid_order",
                pool_id="invalid_pool",
                traffic_amount=-1
            )

        assert exc_info.value.status_code == 500
        assert "代理激活失败" in str(exc_info.value.detail)

    async def test_full_order_flow(self, ipipv_service: IPIPVService):
        """测试完整的订单流程"""
        # 1. 创建订单数据
        order_data = {
            "order_id": "test_order_2",
            "pool_id": "out_dynamic_1",
            "traffic_amount": 100,
            "duration": 30,
            "unit": 3
        }
        
        # 2. 激活代理
        result = await ipipv_service.activate_dynamic_proxy(
            order_id=order_data["order_id"],
            pool_id=order_data["pool_id"],
            traffic_amount=order_data["traffic_amount"],
            duration=order_data["duration"],
            unit=order_data["unit"]
        )
        
        # 3. 验证激活结果
        assert result is not None
        assert isinstance(result, dict)
        assert "order_no" in result
        assert "app_order_no" in result
        assert "status" in result
        assert result["status"] == "pending"
        assert "message" in result
        assert "amount" in result 