from typing import Dict, Any

API_ROUTES: Dict[str, Dict[str, str]] = {
    "AREA": {
        "LIST": "open/app/area/v2",
        "STOCK": "open/app/area/stock/v2"
    },
    "COUNTRY": {
        "LIST": "open/app/country/list/v2"
    },
    "CITY": {
        "LIST": "open/app/city/list/v2"
    },
    "PRODUCT": {
        "QUERY": "open/app/product/query/v2",
        "STOCK": "open/app/product/stock/v2"
    },
    "AUTH": {
        "LOGIN": "auth/login",
        "LOGOUT": "auth/logout"
    },
    "USER": {
        "INFO": "user/info",
        "UPDATE": "user/update"
    },
    "PROXY": {
        "INFO": "proxy/info",
        "BALANCE": "proxy/balance",
        "FLOW_USE_LOG": "proxy/flow/use/log"
    }
}

def get_route(module: str, action: str) -> str:
    """
    获取指定模块和动作的路由
    
    Args:
        module: 模块名称 (如 'AREA', 'COUNTRY' 等)
        action: 动作名称 (如 'LIST', 'STOCK' 等)
        
    Returns:
        str: 路由字符串
        
    Raises:
        KeyError: 如果模块或动作不存在
    """
    try:
        return API_ROUTES[module][action]
    except KeyError:
        raise KeyError(f"Route not found for module '{module}' and action '{action}'")

def get_full_route(module: str, action: str) -> str:
    """
    获取完整的路由路径（包含 /api 前缀）
    
    Args:
        module: 模块名称 (如 'AREA', 'COUNTRY' 等)
        action: 动作名称 (如 'LIST', 'STOCK' 等)
        
    Returns:
        str: 完整的路由路径
        
    Raises:
        KeyError: 如果模块或动作不存在
    """
    return f"/api/{get_route(module, action)}" 