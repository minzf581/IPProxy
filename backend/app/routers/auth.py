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
