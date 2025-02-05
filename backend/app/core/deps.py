from typing import Generator
from app.services.ipproxy_service import IPProxyService

def get_ipproxy_service() -> Generator[IPProxyService, None, None]:
    """
    获取 IPProxyService 实例的依赖函数
    
    Returns:
        Generator[IPProxyService, None, None]: IPProxyService 实例
    """
    service = IPProxyService()
    try:
        yield service
    finally:
        # 如果需要清理资源，可以在这里进行
        pass 