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
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash
import json
import traceback

logger = logging.getLogger(__name__)

class UserService(IPIPVBaseAPI):
    """用户服务类，处理所有用户相关的操作"""
    
    async def create_user(
        self,
        username: str,
        password: str,
        email: Optional[str] = None,
        is_admin: bool = False,
        is_agent: bool = False,
        balance: Optional[float] = None,
        remark: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Optional[User]:
        """
        创建用户
        
        Args:
            username: 用户名（必填）
            password: 密码（必填）
            email: 邮箱（选填）
            is_admin: 是否管理员（默认False）
            is_agent: 是否代理商（默认False）
            balance: 初始余额（选填，默认0.0）
            remark: 备注（选填）
            phone: 联系方式（选填）
            
        Returns:
            User: 创建成功的用户对象
            None: 创建失败
        """
        try:
            logger.info(f"[UserService.create_user] 开始创建用户: username={username}, is_agent={is_agent}")
            
            # 检查必填参数
            if not username or not password:
                logger.error("[UserService.create_user] 缺少必填参数: 用户名和密码是必需的")
                return None
            
            # 获取数据库会话
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                # 检查用户名是否已存在
                existing_user = db.query(User).filter(User.username == username).first()
                if existing_user:
                    logger.warning(f"[UserService.create_user] 用户名已存在: {username}")
                    return None
                
                # 创建新用户
                try:
                    hashed_password = get_password_hash(password)
                    new_user = User(
                        username=username,
                        password=hashed_password,
                        email=email,
                        phone=phone,
                        is_admin=is_admin,
                        is_agent=is_agent,
                        balance=balance if balance is not None else 0.0,
                        remark=remark,
                        status=1,  # 默认状态为正常
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    
                    # 如果是代理商，设置 app_username 和 platform_account
                    if is_agent:
                        try:
                            # 使用测试环境的主账号
                            main_username = "test1006"  # 测试环境的主账号
                            
                            # 调用 IPIPV API 创建代理商账号
                            ipipv_response = await self._make_request(
                                "api/open/app/proxy/user/v2",
                                {
                                    "version": "v2",
                                    "encrypt": "AES",
                                    "appUsername": username,
                                    "password": password,  # 添加密码
                                    "limitFlow": 1024,  # 默认1GB流量
                                    "remark": remark or f"代理商{username}",
                                    "mainUsername": main_username,     # 主账号
                                    "appMainUsername": main_username,  # 主账号
                                    "platformAccount": username,       # 平台账号
                                    "channelAccount": username,        # 渠道商账号
                                    "status": 1,                      # 状态：1=正常
                                    "authType": 1,                    # 认证类型：1=企业认证
                                    "authName": "测试公司",           # 认证名称
                                    "no": "3101112",                 # 证件号码
                                    "phone": phone or "13800138000",  # 手机号码
                                    "email": email or f"{username}@test.com"  # 邮箱
                                }
                            )
                            
                            if ipipv_response and ipipv_response.get("code") == 200:
                                ipipv_data = ipipv_response.get("data", {})
                                new_user.app_username = ipipv_data.get("appUsername") or username
                                new_user.platform_account = ipipv_data.get("platformAccount") or username
                                new_user.ipipv_username = ipipv_data.get("username")
                                new_user.ipipv_password = ipipv_data.get("password")
                            else:
                                logger.error(f"[UserService.create_user] IPIPV API 调用失败: {ipipv_response}")
                                return None
                                
                        except Exception as e:
                            logger.error(f"[UserService.create_user] IPIPV API 调用失败: {str(e)}")
                            return None
                    
                    db.add(new_user)
                    db.commit()
                    db.refresh(new_user)
                    
                    logger.info(f"[UserService.create_user] 用户创建成功: id={new_user.id}")
                    return new_user
                    
                except Exception as e:
                    logger.error(f"[UserService.create_user] 创建用户失败: {str(e)}")
                    db.rollback()
                    return None
                
            finally:
                db.close()
            
        except Exception as e:
            logger.error(f"[UserService.create_user] 创建用户失败: {str(e)}")
            logger.error(f"[UserService.create_user] 错误堆栈: {traceback.format_exc()}")
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