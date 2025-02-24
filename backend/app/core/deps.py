"""
依赖注入模块
==========

此模块提供所有服务的依赖注入函数。
确保每个服务实例都正确初始化并配置必要的参数。

使用示例：
--------
```python
@router.get("/example")
async def example(
    proxy_service: ProxyService = Depends(get_proxy_service)
):
    return await proxy_service.get_proxy_info()
"""

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.services import IPIPVBaseAPI, UserService, ProxyService, AuthService, DashboardService, AreaService
from app.services.static_order_service import StaticOrderService
from app.config import settings
from app.core.security import verify_token
from app.models.user import User
import logging
from app.services.proxy_service import get_proxy_service
from app.services.area_service import get_area_service
from app.services.user_service import get_user_service
from app.services.product_service import get_product_service

logger = logging.getLogger(__name__)

# OAuth2 配置
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_db():
    """获取数据库会话"""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_ipipv_api() -> Generator[IPIPVBaseAPI, None, None]:
    """获取IPIPV基础API实例"""
    api = IPIPVBaseAPI()
    try:
        api.base_url = settings.IPPROXY_API_URL
        api.app_key = settings.IPPROXY_APP_KEY
        api.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化IPIPV API: base_url={api.base_url}")
        yield api
    finally:
        pass

def get_auth_service() -> Generator[AuthService, None, None]:
    """获取认证服务实例"""
    service = AuthService()
    try:
        service.base_url = settings.IPPROXY_API_URL
        service.app_key = settings.IPPROXY_APP_KEY
        service.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化认证服务: base_url={service.base_url}")
        yield service
    finally:
        pass

def get_user_service() -> Generator[UserService, None, None]:
    """获取用户服务实例"""
    service = UserService()
    try:
        service.base_url = settings.IPPROXY_API_URL
        service.app_key = settings.IPPROXY_APP_KEY
        service.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化用户服务: base_url={service.base_url}")
        yield service
    finally:
        pass

def get_proxy_service() -> Generator[ProxyService, None, None]:
    """获取代理服务实例"""
    service = ProxyService()
    try:
        service.base_url = settings.IPPROXY_API_URL
        service.app_key = settings.IPPROXY_APP_KEY
        service.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化代理服务: base_url={service.base_url}")
        yield service
    finally:
        pass

def get_dashboard_service() -> Generator[DashboardService, None, None]:
    """获取仪表盘服务实例"""
    service = DashboardService()
    try:
        service.base_url = settings.IPPROXY_API_URL
        service.app_key = settings.IPPROXY_APP_KEY
        service.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化仪表盘服务: base_url={service.base_url}")
        yield service
    finally:
        pass

def get_area_service() -> Generator[AreaService, None, None]:
    """获取区域服务实例"""
    service = AreaService()
    try:
        service.base_url = settings.IPPROXY_API_URL
        service.app_key = settings.IPPROXY_APP_KEY
        service.app_secret = settings.IPPROXY_APP_SECRET
        logger.debug(f"初始化区域服务: base_url={service.base_url}")
        yield service
    finally:
        pass

def get_static_order_service(
    db: Session = Depends(get_db),
    ipipv_api: IPIPVBaseAPI = Depends(get_ipipv_api)
) -> Generator[StaticOrderService, None, None]:
    """获取静态订单服务实例"""
    service = StaticOrderService(db, ipipv_api)
    try:
        logger.debug("初始化静态订单服务")
        yield service
    finally:
        pass 