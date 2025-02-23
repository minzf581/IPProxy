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
from app.core.security import get_password_hash, verify_password
import json
import traceback
from app.models.transaction import Transaction
from app.schemas.user import UserCreate, BalanceAdjust
import uuid
from decimal import Decimal

logger = logging.getLogger(__name__)

class UserService(IPIPVBaseAPI):
    """用户服务类，处理所有用户相关的操作"""
    
    async def get_user_info(self, user_id: int, db: Session) -> Optional[User]:
        """获取用户信息"""
        try:
            logger.info(f"[UserService] 获取用户信息: user_id={user_id}")
            return db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            logger.error(f"[UserService] 获取用户信息失败: {str(e)}")
            return None
            
    async def update_user(
        self,
        user_id: int,
        db: Session,
        data: Dict[str, Any]
    ) -> Optional[User]:
        """更新用户信息"""
        try:
            logger.info(f"[UserService] 更新用户信息: user_id={user_id}")
            
            # 获取用户
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"[UserService] 用户不存在: {user_id}")
                return None
                
            # 更新用户信息
            for key, value in data.items():
                if key == 'password':
                    value = get_password_hash(value)
                if hasattr(user, key):
                    setattr(user, key, value)
                    
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
            
            logger.info(f"[UserService] 用户信息更新成功: id={user.id}")
            return user
            
        except Exception as e:
            logger.error(f"[UserService] 更新用户信息失败: {str(e)}")
            db.rollback()
            return None

    async def create_ipipv_user(
        self,
        username: str,
        password: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        remark: Optional[str] = None,
        db: Session = None
    ) -> Optional[User]:
        """
        创建 IPIPV 用户
        
        Args:
            username: 用户名
            password: 密码
            email: 可选，邮箱
            phone: 可选，手机号
            remark: 可选，备注
            db: 数据库会话
            
        Returns:
            Optional[User]: 创建成功返回用户对象，失败返回 None
        """
        try:
            logger.info(f"[UserService] 开始创建 IPIPV 用户: username={username}")
            
            # 调用 IPIPV API 创建用户
            ipipv_response = await self._make_request(
                "api/open/app/user/v2",
                {
                    "appUsername": username,
                    "password": password,
                    "phone": phone,
                    "email": email,
                    "status": 1,
                    "authType": 1
                }
            )
            
            if not ipipv_response or ipipv_response.get("code") not in [0, 200]:
                error_msg = ipipv_response.get("msg", "未知错误") if ipipv_response else "API返回为空"
                logger.error(f"[UserService] 创建IPIPV用户失败: {error_msg}")
                return None
                
            # 获取IPIPV返回的用户信息
            ipipv_data = ipipv_response.get("data", {})
            ipipv_username = ipipv_data.get("username")
            ipipv_password = ipipv_data.get("password")
            
            logger.info(f"[UserService] IPIPV用户创建成功: username={ipipv_username}")
            
            # 创建本地用户记录
            user = User(
                username=username,
                password=get_password_hash(password),
                email=email,
                phone=phone,
                is_admin=False,
                is_agent=True,
                balance=0.0,
                remark=remark,
                status=1,
                ipipv_username=ipipv_username,  # 使用 ipipv_username 字段存储 IPIPV 平台用户名
                ipipv_password=ipipv_password
            )
            
            if db:
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"[UserService] 本地用户记录创建成功: id={user.id}")
            
            return user
            
        except Exception as e:
            logger.error(f"[UserService] 创建IPIPV用户失败: {str(e)}")
            logger.error(traceback.format_exc())
            if db:
                db.rollback()
            return None

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
        """创建用户"""
        try:
            logger.info(f"[UserService] 开始创建用户: username={username}")
            
            # 如果是代理商，需要调用IPIPV API创建
            if is_agent:
                try:
                    # 调用 IPIPV API 创建代理商账号
                    ipipv_response = await self._make_request(
                        "api/open/app/user/v2",
                        {
                            "appUsername": username,
                            "password": password,
                            "phone": phone,
                            "email": email,
                            "status": 1,
                            "authType": 1
                        }
                    )
                    
                    if not ipipv_response or ipipv_response.get("code") not in [0, 200]:
                        error_msg = ipipv_response.get("msg", "未知错误") if ipipv_response else "API返回为空"
                        logger.error(f"[UserService] 创建IPIPV代理商失败: {error_msg}")
                        return None
                        
                    # 获取IPIPV返回的用户信息
                    ipipv_data = ipipv_response.get("data", {})
                    ipipv_username = ipipv_data.get("username")
                    ipipv_password = ipipv_data.get("password")
                    
                    logger.info(f"[UserService] IPIPV代理商创建成功: username={ipipv_username}")
                    
                    # 创建本地用户记录
                    user = User(
                        username=username,
                        password=get_password_hash(password),
                        email=email,
                        phone=phone,
                        is_admin=is_admin,
                        is_agent=True,
                        balance=balance or 0.0,
                        remark=remark,
                        status=1,
                        app_username=username,
                        ipipv_username=ipipv_username,
                        ipipv_password=ipipv_password
                    )
                    
                    return user
                    
                except Exception as e:
                    logger.error(f"[UserService] 创建IPIPV代理商时发生错误: {str(e)}")
                    return None
            
            # 如果是普通用户，只需要创建本地记录
            user = User(
                username=username,
                password=get_password_hash(password),
                email=email,
                phone=phone,
                is_admin=is_admin,
                is_agent=is_agent,
                balance=balance or 0.0,
                remark=remark,
                status=1
            )
            
            return user
            
        except Exception as e:
            logger.error(f"[UserService] 创建用户失败: {str(e)}")
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

    @staticmethod
    async def adjust_balance(
        db: Session, 
        user_id: int, 
        adjust_data: BalanceAdjust,
        operator_id: int
    ) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")

        new_balance = user.balance + adjust_data.amount
        if new_balance < 0:
            raise ValueError("余额不足")

        try:
            # 更新用户余额
            user.balance = new_balance
            user.updated_at = datetime.now()

            # 记录交易
            transaction = Transaction(
                transaction_no=f"ADJ{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}",
                user_id=user_id,
                agent_id=operator_id,  # 操作人ID作为代理商ID
                order_no=f"ADJ{datetime.now().strftime('%Y%m%d%H%M%S')}",
                amount=Decimal(str(adjust_data.amount)),
                balance=Decimal(str(new_balance)),
                type="adjust",  # 调整类型
                status="success",
                remark=adjust_data.remark
            )
            db.add(transaction)
            
            db.commit()
            db.refresh(user)
            return user
        except Exception as e:
            db.rollback()
            raise e

def get_user_service() -> UserService:
    """
    工厂函数，用于创建 UserService 实例
    
    Returns:
        UserService: 用户服务实例
    """
    return UserService() 