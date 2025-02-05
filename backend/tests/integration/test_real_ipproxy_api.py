import pytest
import os
import logging
from app.services.ipproxy_service import IPProxyService

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
class TestRealIPIPVAPI:
    @pytest.fixture(scope="class")
    def ipproxy_service(self):
        """创建IPIPV服务实例"""
        service = IPProxyService()
        service.base_url = os.getenv('IPPROXY_API_URL', 'https://sandbox.ipipv.com/api')
        service.app_key = os.getenv('IPPROXY_APP_KEY', 'AK20241120145620')
        service.app_secret = os.getenv('IPPROXY_APP_SECRET', 'bf3ffghlt0hpc4omnvc2583jt0fag6a4')
        logger.info("API服务初始化完成")
        return service
    
    @pytest.fixture(scope="class")
    async def test_user(self, ipproxy_service):
        """创建测试用户"""
        user_params = {
            "version": "v2",
            "encrypt": "AES",
            "phone": "13800138000",
            "email": "test@example.com",
            "authType": 2,
            "authName": "测试用户",
            "no": "110101199001011234",
            "status": 1,
            "appUsername": "test_user",
            "password": "Test123456",
        }
        
        response = await ipproxy_service._make_request("open/app/user/v2", user_params)
        logger.info(f"用户创建: {truncate_response(response)}")
        return "test_user"
    
    async def test_1_get_area_list(self, ipproxy_service):
        """测试获取区域列表"""
        response = await ipproxy_service._make_request("open/app/area/v2", {
            "version": "v2",
            "encrypt": "AES",
            "type": 1
        })
        logger.info(f"区域列表: {truncate_response(response)}")
        if not response:
            logger.error("获取区域列表失败")
            assert False
        assert isinstance(response, list)
        area = response[0]
        assert "code" in area
        assert "children" in area
            
    async def test_2_get_city_list(self, ipproxy_service):
        """测试获取城市列表"""
        response = await ipproxy_service._make_request("open/app/city/list/v2", {
            "version": "v2",
            "encrypt": "AES",
            "countryCode": "CN"
        })
        logger.info(f"城市列表: {truncate_response(response)}")
        if not response:
            logger.error("获取城市列表失败")
            assert False
        assert isinstance(response, list)
        city = response[0]
        assert "cityCode" in city
        assert "cityName" in city
            
    async def test_3_get_proxy_info(self, ipproxy_service, test_user):
        """测试获取代理信息"""
        username = await test_user  # 等待test_user协程完成
        
        # 先创建产品
        create_product_response = await ipproxy_service._make_request("open/app/product/create/v2", {
            "proxyType": 104,  # DYNAMIC_FOREIGN类型
            "productNo": "out_dynamic_1",
            "username": username,
            "appUsername": username,
            "count": 1,
            "autoRenew": 0
        })
        logger.info(f"产品创建: {truncate_response(create_product_response)}")
        
        # 获取代理信息
        response = await ipproxy_service._make_request("open/app/proxy/info/v2", {
            "version": "v2",
            "encrypt": "AES",
            "appUsername": username,
            "proxyType": 104,  # DYNAMIC_FOREIGN类型
            "productNo": "out_dynamic_1"  # 添加产品编号
        })
        logger.info(f"代理信息: {truncate_response(response)}")
        if not response:
            logger.error("获取代理信息失败")
            assert False
        assert isinstance(response, dict) 