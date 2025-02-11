from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.user import User
from app.database import get_db
from app.core.security import verify_password, get_password_hash
from app.config import settings, SECRET_KEY, ALGORITHM
import logging
import os

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",  # 修改为实际的登录接口路径
    auto_error=False  # 允许自定义错误消息
)

class AuthService:
    """认证服务类，处理所有认证相关的操作"""
    
    def __init__(self):
        """初始化认证服务"""
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """创建访问令牌"""
        try:
            to_encode = data.copy()
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(days=180)  # 默认180天过期
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            logger.debug(f"Created access token for user: {data.get('sub')}")
            return encoded_jwt
        except Exception as e:
            logger.error(f"创建访问令牌失败: {str(e)}")
            return None
            
    def verify_token(self, token: str):
        """验证令牌"""
        try:
            logger.info(f"[Auth Service] Verifying token: {token[:10]}...")
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            logger.info(f"[Auth Service] Token decoded successfully: {payload}")
            return payload
        except JWTError as e:
            logger.error(f"[Auth Service] Token verification failed: {str(e)}")
            return None
            
    async def authenticate_user(self, username: str, password: str, db: Session) -> Optional[User]:
        """验证用户"""
        try:
            logger.debug(f"开始认证用户: {username}")
            
            # 从数据库中查询用户
            user = db.query(User).filter(User.username == username).first()
            if not user:
                logger.debug(f"用户 {username} 不存在")
                return None
                
            # 验证密码
            logger.debug(f"开始验证密码: password={password}, user.password={user.password}")
            if verify_password(password, user.password):
                logger.debug("用户密码验证成功")
                # 更新最后登录时间
                user.last_login_at = datetime.utcnow()
                db.commit()
                return user
            else:
                logger.debug("用户密码验证失败")
                return None
                
        except Exception as e:
            logger.error(f"认证过程发生错误: {str(e)}")
            logger.exception("详细错误信息:")
            return None
            
    async def get_current_user(
        self,
        token: str = Depends(oauth2_scheme),
        x_app_key: str = Header(None, alias="X-App-Key"),
        x_app_secret: str = Header(None, alias="X-App-Secret"),
        db: Session = Depends(get_db)
    ) -> Optional[User]:
        """获取当前用户"""
        logger.info("[Auth Service] Getting current user")
        
        # 如果有X-App-Key和X-App-Secret，优先使用这些进行认证
        if x_app_key and x_app_secret:
            logger.info("[Auth Service] Using API key authentication")
            if x_app_key == os.getenv('APP_ID', "AK20241120145620") and \
               x_app_secret == os.getenv('APP_SECRET', "bf3ffghlt0hpc4omnvc2583jt0fag6a4"):
                logger.info("[Auth Service] API key authentication successful")
                return User(
                    id=0,
                    username="system",
                    password="",
                    email="system@example.com",
                    is_admin=True,
                    status="active",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
            else:
                logger.warning("[Auth Service] Invalid API key or secret")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的API密钥",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        if not token:
            logger.error("[Auth Service] No token provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="未提供认证令牌",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        try:
            logger.debug("开始验证访问令牌")
            
            try:
                logger.debug(f"开始解码令牌: {token}")
                payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
                user_id: str = payload.get("sub")
                logger.debug(f"令牌解码结果: {payload}")
                if user_id is None:
                    logger.error("令牌中没有用户ID")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="无效的认证令牌",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
            except JWTError:
                logger.error("令牌解码失败")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的认证令牌",
                    headers={"WWW-Authenticate": "Bearer"},
                )
                
            try:
                user_id_int = int(user_id)
                user = db.query(User).filter(User.id == user_id_int).first()
                if user is None:
                    logger.error(f"找不到用户ID: {user_id_int}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="用户不存在",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                return user
            except ValueError:
                logger.error(f"无效的用户ID格式: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的用户ID",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"验证访问令牌时发生错误: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="认证失败",
                headers={"WWW-Authenticate": "Bearer"},
            )

# 创建全局函数，使用 AuthService 的实例方法
auth_service = AuthService()
create_access_token = auth_service.create_access_token
verify_token = auth_service.verify_token
authenticate_user = auth_service.authenticate_user
get_current_user = auth_service.get_current_user 