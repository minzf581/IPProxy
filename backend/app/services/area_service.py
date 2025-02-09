"""
区域服务模块
==========

此模块提供所有与区域相关的功能，包括：
1. 区域列表获取
2. 城市列表获取
3. IP段列表获取

此模块继承自IPIPVBaseAPI，使用其提供的基础通信功能。

使用示例：
--------
```python
area_service = AreaService()
areas = await area_service.get_area_list()
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

class AreaService(IPIPVBaseAPI):
    """区域服务类，处理所有区域相关的操作"""
    
    async def get_area_list(self, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        获取区域列表
        
        Args:
            params: 可选的查询参数
            
        Returns:
            List[Dict[str, Any]]: 区域列表
        """
        try:
            logger.info("[AreaService] 开始获取区域列表")
            request_params = {
                "appUsername": "test_user"
            }
            if params:
                request_params.update(params)
                
            result = await self._make_request("api/open/app/area/v2", request_params)
            return result if isinstance(result, list) else []
            
        except Exception as e:
            logger.error(f"[AreaService] 获取区域列表失败: {str(e)}")
            return []
            
    async def get_city_list(self, country_code: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        获取城市列表
        
        Args:
            country_code: 国家代码
            params: 可选的查询参数
            
        Returns:
            List[Dict[str, Any]]: 城市列表
        """
        try:
            logger.info(f"[AreaService] 开始获取城市列表: country_code={country_code}")
            request_params = {
                "countryCode": country_code,
                "appUsername": "test_user"
            }
            if params:
                request_params.update(params)
                
            result = await self._make_request("api/open/app/city/list/v2", request_params)
            return result if isinstance(result, list) else []
            
        except Exception as e:
            logger.error(f"[AreaService] 获取城市列表失败: {str(e)}")
            return []
            
    async def get_ip_ranges(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取IP段列表
        
        Args:
            params: 查询参数，必须包含：
                - proxyType: 代理类型
                - countryCode: 国家代码
                - cityCode: 城市代码
                
        Returns:
            List[Dict[str, Any]]: IP段列表
        """
        try:
            logger.info(f"[AreaService] 开始获取IP段列表: params={params}")
            
            # 验证必要参数
            required_params = ["proxyType"]
            for param in required_params:
                if param not in params:
                    logger.error(f"[AreaService] 缺少必要参数: {param}")
                    return []
                    
            # 添加默认参数
            request_params = {
                "appUsername": "test_user",
                "version": "v2"
            }
            request_params.update(params)
            
            result = await self._make_request("api/open/app/product/query/v2", request_params)
            return result if isinstance(result, list) else []
            
        except Exception as e:
            logger.error(f"[AreaService] 获取IP段列表失败: {str(e)}")
            return [] 