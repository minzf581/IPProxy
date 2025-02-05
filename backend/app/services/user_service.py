"""
用户服务模块
==========

此模块处理所有与用户相关的功能，包括：
1. 用户管理（创建、更新、查询）
2. 认证授权
3. 用户统计
4. 应用信息获取

此模块继承自IPIPVBaseAPI，使用其提供的基础通信功能。

使用示例：
--------
```python
user_service = UserService()
user_info = await user_service.get_user_info(user_id)
```

注意事项：
--------
1. 所有方法都应该使用异步调用
2. 确保正确处理错误情况
3. 添加必要的日志记录
4. 注意敏感信息的处理
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .ipipv_base_api import IPIPVBaseAPI

logger = logging.getLogger(__name__)

class UserService(IPIPVBaseAPI):
    """用户服务类，处理所有用户相关的操作"""
    
    async def create_user(self, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        创建用户
        
        Args:
            params: 用户创建参数，包括：
                - username: 用户名
                - password: 密码
                - email: 可选，邮箱
                - phone: 可选，电话
                - authType: 认证类型
                - status: 状态
                
        Returns:
            dict: 创建成功的用户信息
            None: 创建失败
        """
        try:
            logger.info(f"开始创建用户: {params.get('username')}")
            return await self._make_request("api/open/app/user/create/v2", params)
        except Exception as e:
            logger.error(f"创建用户失败: {str(e)}")
            return None
    
    async def update_user(self, user_id: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        更新用户信息
        
        Args:
            user_id: 用户ID
            params: 更新参数
            
        Returns:
            dict: 更新后的用户信息
            None: 更新失败
        """
        try:
            logger.info(f"更新用户信息: user_id={user_id}")
            return await self._make_request(f"api/open/app/user/{user_id}/v2", params)
        except Exception as e:
            logger.error(f"更新用户信息失败: {str(e)}")
            return None
    
    async def get_user_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        获取用户信息
        
        Args:
            user_id: 用户ID
            
        Returns:
            dict: 用户详细信息
            None: 获取失败
        """
        try:
            logger.info(f"获取用户信息: user_id={user_id}")
            return await self._make_request(f"api/open/app/user/{user_id}/v2")
        except Exception as e:
            logger.error(f"获取用户信息失败: {str(e)}")
            return None
    
    async def get_app_info(self) -> Optional[Dict[str, Any]]:
        """
        获取应用信息
        
        Returns:
            dict: 应用详细信息
            None: 获取失败
        """
        try:
            logger.info("获取应用信息")
            return await self._make_request("api/open/app/info/v2")
        except Exception as e:
            logger.error(f"获取应用信息失败: {str(e)}")
            return None
    
    async def get_statistics(self) -> Optional[Dict[str, Any]]:
        """
        获取用户统计信息
        
        Returns:
            dict: 统计信息，包括使用量、余额等
            None: 获取失败
        """
        try:
            logger.info("获取统计信息")
            return await self._make_request("api/open/app/statistics/v2")
        except Exception as e:
            logger.error(f"获取统计信息失败: {str(e)}")
            return None
    
    async def update_password(self, user_id: str, new_password: str) -> bool:
        """
        更新用户密码
        
        Args:
            user_id: 用户ID
            new_password: 新密码
            
        Returns:
            bool: 是否更新成功
        """
        try:
            logger.info(f"更新用户密码: user_id={user_id}")
            result = await self._make_request(
                f"api/open/app/user/{user_id}/password/v2",
                {"password": new_password}
            )
            return result is not None
        except Exception as e:
            logger.error(f"更新用户密码失败: {str(e)}")
            return False
    
    async def get_user_list(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取用户列表
        
        Args:
            params: 查询参数，包括：
                - page: 页码
                - pageSize: 每页数量
                - status: 可选，状态过滤
                - keyword: 可选，关键词搜索
                
        Returns:
            list: 用户列表
            空列表: 获取失败
        """
        try:
            logger.info(f"获取用户列表: {params}")
            result = await self._make_request("api/open/app/user/list/v2", params)
            return result.get("list", []) if isinstance(result, dict) else []
        except Exception as e:
            logger.error(f"获取用户列表失败: {str(e)}")
            return [] 