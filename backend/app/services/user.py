"""
用户服务模块
==========

此模块提供所有与用户相关的功能，包括：
1. 用户管理
2. 用户认证
3. 用户权限
4. 用户配置

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
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .ipipv_base_api import IPIPVBaseAPI
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash, verify_password

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
            
    async def create_user(
        self, 
        db: Session,
        username: str, 
        password: str, 
        email: str,
        is_admin: bool = False,
        is_agent: bool = False
    ) -> Optional[User]:
        """创建新用户"""
        try:
            logger.info(f"[UserService] 创建新用户: username={username}")
            
            # 检查用户名是否已存在
            existing_user = db.query(User).filter(User.username == username).first()
            if existing_user:
                logger.warning(f"[UserService] 用户名已存在: {username}")
                return None
                
            # 创建新用户
            hashed_password = get_password_hash(password)
            new_user = User(
                username=username,
                password=hashed_password,
                email=email,
                is_admin=is_admin,
                is_agent=is_agent,
                status=1,  # 1=正常
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            logger.info(f"[UserService] 用户创建成功: id={new_user.id}")
            return new_user
            
        except Exception as e:
            logger.error(f"[UserService] 创建用户失败: {str(e)}")
            db.rollback()
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
            
    async def delete_user(self, user_id: int, db: Session) -> bool:
        """删除用户"""
        try:
            logger.info(f"[UserService] 删除用户: user_id={user_id}")
            
            # 获取用户
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"[UserService] 用户不存在: {user_id}")
                return False
                
            # 软删除：将状态设置为0
            user.status = 0
            user.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"[UserService] 用户删除成功: id={user.id}")
            return True
            
        except Exception as e:
            logger.error(f"[UserService] 删除用户失败: {str(e)}")
            db.rollback()
            return False
            
    async def get_user_list(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 10,
        filters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """获取用户列表"""
        try:
            logger.info(f"[UserService] 获取用户列表: page={page}, page_size={page_size}")
            
            # 构建查询
            query = db.query(User)
            
            # 应用过滤条件
            if filters:
                if 'username' in filters:
                    query = query.filter(User.username.like(f"%{filters['username']}%"))
                if 'email' in filters:
                    query = query.filter(User.email.like(f"%{filters['email']}%"))
                if 'status' in filters:
                    query = query.filter(User.status == filters['status'])
                if 'is_agent' in filters:
                    query = query.filter(User.is_agent == filters['is_agent'])
                    
            # 计算总数
            total = query.count()
            
            # 分页
            users = query.offset((page - 1) * page_size).limit(page_size).all()
            
            return {
                "total": total,
                "items": users,
                "page": page,
                "page_size": page_size
            }
            
        except Exception as e:
            logger.error(f"[UserService] 获取用户列表失败: {str(e)}")
            return {
                "total": 0,
                "items": [],
                "page": page,
                "page_size": page_size
            }
            
    async def change_password(
        self,
        user_id: int,
        old_password: str,
        new_password: str,
        db: Session
    ) -> bool:
        """修改用户密码"""
        try:
            logger.info(f"[UserService] 修改用户密码: user_id={user_id}")
            
            # 获取用户
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"[UserService] 用户不存在: {user_id}")
                return False
                
            # 验证旧密码
            if not verify_password(old_password, user.password):
                logger.warning(f"[UserService] 旧密码验证失败: user_id={user_id}")
                return False
                
            # 更新密码
            user.password = get_password_hash(new_password)
            user.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"[UserService] 密码修改成功: id={user.id}")
            return True
            
        except Exception as e:
            logger.error(f"[UserService] 修改密码失败: {str(e)}")
            db.rollback()
            return False
            
    async def reset_password(
        self,
        user_id: int,
        new_password: str,
        db: Session
    ) -> bool:
        """重置用户密码"""
        try:
            logger.info(f"[UserService] 重置用户密码: user_id={user_id}")
            
            # 获取用户
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"[UserService] 用户不存在: {user_id}")
                return False
                
            # 重置密码
            user.password = get_password_hash(new_password)
            user.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"[UserService] 密码重置成功: id={user.id}")
            return True
            
        except Exception as e:
            logger.error(f"[UserService] 重置密码失败: {str(e)}")
            db.rollback()
            return False 