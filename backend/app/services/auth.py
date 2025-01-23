from datetime import datetime, timedelta
from typing import Optional
import jwt
from jwt.exceptions import PyJWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from ..models.user import User
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

SECRET_KEY = "your-secret-key"  # 在生产环境中应该使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# 测试用户数据
TEST_USER = {
    "id": 1,
    "username": "admin",
    "password": "admin123"  # 实际存储的是哈希后的密码
}
TEST_USER["hashed_password"] = pwd_context.hash(TEST_USER["password"])

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False

def get_password_hash(password):
    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Password hashing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="密码加密失败"
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.debug(f"Created access token for user: {data.get('sub')}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Token creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="令牌生成失败"
        )

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except PyJWTError:
        return None

async def authenticate_user(username: str, password: str):
    try:
        logger.debug(f"开始认证用户: {username}")
        logger.debug(f"测试用户数据: {TEST_USER}")
        # 检查是否是测试用户
        if username != TEST_USER["username"]:
            logger.debug(f"用户 {username} 不存在")
            return False
            
        logger.debug("开始验证密码...")
        is_valid = verify_password(password, TEST_USER["hashed_password"])
        logger.debug(f"密码验证结果: {is_valid}")
        
        if not is_valid:
            logger.debug(f"用户 {username} 密码无效")
            return False
            
        logger.debug(f"用户 {username} 认证成功，创建用户对象")
        user = User(
            id=TEST_USER["id"],
            username=TEST_USER["username"],
            password=TEST_USER["hashed_password"],
            email="admin@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        logger.debug(f"创建的用户对象: {user}")
        return user
    except Exception as e:
        logger.error(f"认证过程发生错误: {str(e)}")
        logger.exception("详细错误信息:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"认证过程发生错误: {str(e)}"
        )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        logger.debug("开始验证访问令牌")
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            logger.debug(f"开始解码令牌: {token}")
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            logger.debug(f"令牌解码结果: {payload}")
            username: str = payload.get("sub")
            if username is None:
                logger.debug("令牌中缺少用户名")
                raise credentials_exception
        except PyJWTError as e:
            logger.error(f"JWT解码错误: {str(e)}")
            raise credentials_exception
            
        logger.debug(f"检查用户是否存在: {username}")
        if username != TEST_USER["username"]:
            logger.debug(f"用户 {username} 不存在")
            raise credentials_exception
            
        logger.debug(f"令牌验证成功，用户: {username}")
        user = User(
            id=TEST_USER["id"],
            username=TEST_USER["username"],
            password=TEST_USER["hashed_password"],
            email="admin@example.com",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        logger.debug(f"创建的用户对象: {user}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="用户验证过程发生错误"
        ) 