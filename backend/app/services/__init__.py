"""
代理服务模块
==========

此模块提供所有与代理相关的功能。

使用示例：
--------
```python
from app.services import ProxyService
proxy_service = ProxyService()
```
"""

from .ipipv_base_api import IPIPVBaseAPI
from .proxy_service import ProxyService
from .user_service import UserService
from .auth import AuthService
from .dashboard import DashboardService
from .area_service import AreaService

__all__ = [
    'IPIPVBaseAPI',
    'ProxyService',
    'UserService',
    'AuthService',
    'DashboardService',
    'AreaService'
] 