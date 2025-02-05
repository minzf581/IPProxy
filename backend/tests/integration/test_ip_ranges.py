import pytest
import os
import logging
from app.services.ipproxy_service import IPProxyService

# 设置日志级别和格式
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@pytest.mark.asyncio
class TestIPRanges:
    @pytest.fixture(scope="class")
    def ipproxy_service(self):
        """创建IPIPV服务实例"""
        service = IPProxyService()
        service.base_url = os.getenv('IPPROXY_API_URL', 'https://sandbox.ipipv.com')
        service.app_key = os.getenv('IPPROXY_APP_KEY', 'AK20241120145620')
        service.app_secret = os.getenv('IPPROXY_APP_SECRET', 'bf3ffghlt0hpc4omnvc2583jt0fag6a4')
        logger.info(f"API服务初始化完成, base_url: {service.base_url}")
        return service

    async def test_get_residential_ip_ranges(self, ipproxy_service):
        """测试获取住宅代理IP段"""
        params = {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": [101]  # 静态住宅代理
        }
        response = await ipproxy_service._make_request("api/open/app/product/query/v2", params)
        logger.info(f"住宅代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "productNo" in item, "响应中应包含 productNo"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "productNo" in response, "响应中应包含 productNo"

    async def test_get_datacenter_ip_ranges(self, ipproxy_service):
        """测试获取数据中心代理IP段"""
        params = {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": [102],  # 静态数据中心代理
            "ispType": 4,        # 数据中心类型
            "countryCode": "JP", # 日本
            "cityCode": "JP000TYO"  # 东京
        }
        response = await ipproxy_service._make_request("api/open/app/product/query/v2", params)
        logger.info(f"数据中心代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "productNo" in item, "响应中应包含 productNo"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "productNo" in response, "响应中应包含 productNo"

    async def test_get_mobile_ip_ranges(self, ipproxy_service):
        """测试获取手机代理IP段"""
        params = {
            "version": "v2",
            "encrypt": "AES",
            "proxyType": [103],  # 静态手机代理
            "unit": 1,           # 时长单位：天
            "duration": 30       # 最小购买时长：30天
        }
        response = await ipproxy_service._make_request("api/open/app/product/query/v2", params)
        logger.info(f"手机代理IP段响应: {response}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for item in response:
                logger.info(f"IP段信息: {item}")
                if isinstance(item, dict):
                    assert "productNo" in item, "响应中应包含 productNo"
        elif isinstance(response, dict):
            logger.info(f"IP段详细信息: {response}")
            assert "productNo" in response, "响应中应包含 productNo" 