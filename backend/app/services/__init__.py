"""
IPIPV API 服务模块
===============

此包提供了所有与IPIPV API交互的服务类。

可用服务：
--------
- IPIPVBaseAPI: 基础API服务类，提供通信功能
- ProxyService: 代理服务，处理代理相关功能
- AreaService: 区域服务，处理地理位置相关功能
- UserService: 用户服务，处理用户相关功能

使用示例：
--------
```python
from app.services import ProxyService

proxy_service = ProxyService()
proxy_info = await proxy_service.get_proxy_info(proxy_id)
```
"""

from .ipipv_base_api import IPIPVBaseAPI
from .proxy_service import ProxyService
from .area_service import AreaService
from .user_service import UserService

__all__ = [
    'IPIPVBaseAPI',
    'ProxyService',
    'AreaService',
    'UserService',
] 