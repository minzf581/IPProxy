"""
认证授权路由模块
==============

此模块处理所有与认证和授权相关的路由请求，包括：
- 用户登录认证
- 令牌生成和验证
- 密码管理
- 用户信息获取

重要提示：
---------
1. 此模块是系统安全的核心，需要特别注意安全性
2. 所有密码和敏感信息必须加密处理
3. 令牌的生成和验证需要严格控制

依赖关系：
---------
- 数据模型：
  - User (app/models/user.py)
  - UserCreate (app/schemas/user.py)
  - UserLogin (app/schemas/user.py)
  - UserResponse (app/schemas/user.py)
- 服务：
  - AuthService (app/services/auth.py)
  - OAuth2PasswordBearer (fastapi.security)

前端对应：
---------
- 服务层：src/services/authService.ts
- 页面组件：src/pages/login/index.tsx
- 类型定义：src/types/auth.ts

认证流程：
---------
1. 登录流程：
   - 验证用户名和密码
   - 生成访问令牌
   - 返回用户信息

2. 令牌验证：
   - 检查令牌有效性
   - 获取当前用户
   - 验证用户状态

3. 密码管理：
   - 验证原密码
   - 更新新密码
   - 记录修改日志

修改注意事项：
------------
1. 安全性：
   - 密码必须加密存储
   - 令牌需要加密传输
   - 防止暴力破解
   - 防止重放攻击

2. 错误处理：
   - 友好的错误提示
   - 详细的错误日志
   - 登录失败处理
   - 异常行为记录

3. 性能优化：
   - 缓存令牌验证
   - 优化数据库查询
   - 异步处理日志
   - 限制并发请求
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash
)
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from app.database import get_db

# 设置日志记录器
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

@router.post("/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    try:
        user = await authenticate_user(user_data.username, user_data.password, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        return {
            "code": 0,
            "message": "登录成功",
            "data": {
                "token": access_token,
                "user": UserResponse.from_orm(user)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"登录失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/current-user")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    try:
        return {
            "code": 0,
            "message": "获取用户信息成功",
            "data": UserResponse.from_orm(current_user)
        }
    except Exception as e:
        logger.error(f"获取用户信息失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/password")
async def update_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user)
):
    """修改密码"""
    try:
        if not authenticate_user(current_user.username, old_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="原密码错误"
            )
        
        current_user.password = get_password_hash(new_password)
        return {
            "code": 0,
            "message": "密码修改成功",
            "data": None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"修改密码失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
