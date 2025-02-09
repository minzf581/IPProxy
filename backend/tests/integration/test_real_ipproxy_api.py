import pytest
import os
import logging
import time
import hashlib
from app.services import IPIPVBaseAPI, ProxyService
from app.utils.logging_utils import truncate_response

def truncate_response(response, max_length=20):
    """截断响应内容，使日志更简洁"""
    if response is None:
        return None
    if isinstance(response, (list, dict)):
        return f"{type(response).__name__}[{len(response)}]"
    str_response = str(response)
    if len(str_response) > max_length:
        return f"{str_response[:max_length]}..."
    return str_response

# 设置日志级别和格式
logging.basicConfig(
    level=logging.WARNING,
    format='%(levelname).1s %(message)s'
)

# 设置所有第三方库的日志级别为ERROR
for logger_name in ['httpcore', 'httpx', 'asyncio', 'urllib3', 'requests']:
    logging.getLogger(logger_name).setLevel(logging.ERROR)

logger = logging.getLogger('test_api')
logger.setLevel(logging.INFO)

@pytest.mark.asyncio
class TestIPIPVAPI:
    """测试IPIPV API基础功能"""
    
    @pytest.fixture
    def api(self):
        return IPIPVBaseAPI()
    
    async def test_get_area_list(self, api):
        """测试获取区域列表"""
        result = await api._make_request("api/open/app/area/v2", {
            "appUsername": "test_user"
        })
        assert result is not None
        assert isinstance(result, list)
        
    async def test_get_city_list(self, api):
        """测试获取城市列表"""
        result = await api._make_request("api/open/app/city/list/v2", {
            "countryCode": "US",
            "appUsername": "test_user"
        })
        assert result is not None
        assert isinstance(result, list)

@pytest.mark.asyncio
class TestProxyService:
    """测试代理服务功能"""
    
    @pytest.fixture
    def service(self):
        return ProxyService()
    
    async def test_get_proxy_info(self, service):
        """测试获取代理信息"""
        result = await service.get_proxy_info()
        assert result is not None