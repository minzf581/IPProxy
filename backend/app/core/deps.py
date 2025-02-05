"""
依赖注入模块
==========

此模块提供所有服务的依赖注入函数。
确保每个服务实例都正确初始化并配置必要的参数。

使用示例：
--------
```python
@router.get("/example")
async def example(
    proxy_service: ProxyService = Depends(get_proxy_service)
):
    return await proxy_service.get_proxy_info()
"""

from typing import Generator
from app.services import ProxyService, UserService, AreaService
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def get_proxy_service() -> Generator[ProxyService, None, None]:
    """获取代理服务实例"""
    service = ProxyService()
    try:
        service.base_url = settings.IPPROXY_API_URL
        service.app_key = settings.IPPROXY_APP_KEY
        service.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化代理服务: base_url={service.base_url}")
        yield service
    finally:
        pass

def get_user_service() -> Generator[UserService, None, None]:
    """获取用户服务实例"""
    service = UserService()
    try:
        service.base_url = settings.IPPROXY_API_URL
        service.app_key = settings.IPPROXY_APP_KEY
        service.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化用户服务: base_url={service.base_url}")
        yield service
    finally:
        pass

def get_area_service() -> Generator[AreaService, None, None]:
    """获取区域服务实例"""
    service = AreaService()
    try:
        service.base_url = settings.IPPROXY_API_URL
        service.app_key = settings.IPPROXY_APP_KEY
        service.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化区域服务: base_url={service.base_url}")
        yield service
    finally:
        pass 