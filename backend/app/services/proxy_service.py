"""
代理服务模块
==========

此模块处理所有与代理相关的功能，包括：
1. 动态代理管理
2. 静态代理管理
3. 代理池操作
4. IP范围查询
5. 价格计算

此模块继承自IPIPVBaseAPI，使用其提供的基础通信功能。

使用示例：
--------
```python
proxy_service = ProxyService()
proxy_info = await proxy_service.get_proxy_info(proxy_id)
```

注意事项：
--------
1. 所有方法都应该使用异步调用
2. 确保正确处理错误情况
3. 添加必要的日志记录
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .ipipv_base_api import IPIPVBaseAPI

logger = logging.getLogger(__name__)

class ProxyService(IPIPVBaseAPI):
    """代理服务类，处理所有代理相关的操作"""
    
    async def create_dynamic_proxy(self, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        创建动态代理
        
        Args:
            params: 创建参数，包括：
                - poolId: 代理池ID
                - trafficAmount: 流量数量
                - username: 可选，用户名
                - password: 可选，密码
                - remark: 可选，备注
                
        Returns:
            dict: 创建成功的代理信息
            None: 创建失败
        """
        try:
            logger.info(f"开始创建动态代理: {params}")
            return await self._make_request("api/open/app/proxy/open/v2", params)
        except Exception as e:
            logger.error(f"创建动态代理失败: {str(e)}")
            return None
    
    async def get_proxy_info(self, proxy_id: str) -> Optional[Dict[str, Any]]:
        """
        获取代理信息
        
        Args:
            proxy_id: 代理ID
            
        Returns:
            dict: 代理详细信息
            None: 获取失败
        """
        try:
            logger.info(f"获取代理信息: {proxy_id}")
            return await self._make_request("api/open/app/proxy/info/v2", {"proxyId": proxy_id})
        except Exception as e:
            logger.error(f"获取代理信息失败: {str(e)}")
            return None
    
    async def refresh_proxy(self, proxy_id: str) -> bool:
        """
        刷新代理
        
        Args:
            proxy_id: 代理ID
            
        Returns:
            bool: 是否刷新成功
        """
        try:
            logger.info(f"刷新代理: {proxy_id}")
            result = await self._make_request(
                "api/open/app/proxy/refresh/v2", 
                {"proxyId": proxy_id}
            )
            return result is not None
        except Exception as e:
            logger.error(f"刷新代理失败: {str(e)}")
            return False
    
    async def calculate_price(self, params: Dict[str, Any]) -> Optional[float]:
        """
        计算代理价格
        
        Args:
            params: 计价参数，包括：
                - proxyType: 代理类型
                - duration: 时长
                - amount: 数量
                
        Returns:
            float: 计算得到的价格
            None: 计算失败
        """
        try:
            logger.info(f"计算代理价格: {params}")
            result = await self._make_request(
                "api/open/app/proxy/price/calculate/v2", 
                params
            )
            return float(result["price"]) if result and "price" in result else None
        except Exception as e:
            logger.error(f"计算代理价格失败: {str(e)}")
            return None
    
    async def get_proxy_pools(self) -> List[Dict[str, Any]]:
        """
        获取代理池列表
        
        Returns:
            list: 代理池列表
            空列表: 获取失败
        """
        try:
            logger.info("获取代理池列表")
            result = await self._make_request("api/open/app/proxy/pools/v2")
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"获取代理池列表失败: {str(e)}")
            return []
    
    async def get_ip_ranges(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取IP范围列表
        
        Args:
            params: 查询参数，包括：
                - regionCode: 区域代码
                - countryCode: 国家代码
                - cityCode: 城市代码
                - staticType: 静态代理类型
                
        Returns:
            list: IP范围列表
            空列表: 获取失败
        """
        try:
            logger.info(f"获取IP范围列表: {params}")
            result = await self._make_request(
                "api/open/app/area/ip-ranges/v2", 
                params
            )
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"获取IP范围列表失败: {str(e)}")
            return [] 