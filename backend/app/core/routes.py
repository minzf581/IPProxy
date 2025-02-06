"""
路由配置模块
==========

此模块定义了所有API路由的配置，作为前后端的单一真实来源。
前端和后端都应该使用这个配置来保持路由的一致性。

使用方式：
--------
1. 在路由定义中导入并使用：
   ```python
   from app.core.routes import API_ROUTES
   
   @router.post(API_ROUTES["USER"]["CREATE"])
   async def create_user():
       pass
   ```

2. 在服务层中使用：
   ```python
   from app.core.routes import API_ROUTES
   
   class UserService:
       async def create_user(self):
           endpoint = API_ROUTES["USER"]["CREATE"]
   ```
"""

from typing import Dict, Any

# API 版本
API_VERSION = "v2"

# API 基础路径
API_BASE = "/api"

# API 模块前缀
API_PREFIX = {
    "OPEN": "open/app",
    "AUTH": "auth",
    "USER": "user",
    "ADMIN": "admin",
    "PROXY": "proxy"
}

# API 路由配置
API_ROUTES: Dict[str, Dict[str, str]] = {
    "AUTH": {
        "LOGIN": f"{API_PREFIX['AUTH']}/login",
        "LOGOUT": f"{API_PREFIX['AUTH']}/logout",
        "REFRESH": f"{API_PREFIX['AUTH']}/refresh",
        "PROFILE": f"{API_PREFIX['AUTH']}/profile"
    },
    "USER": {
        "CREATE": f"{API_PREFIX['OPEN']}/user/create",
        "LIST": f"{API_PREFIX['USER']}/list",
        "UPDATE": f"{API_PREFIX['USER']}/{{id}}",
        "DELETE": f"{API_PREFIX['USER']}/{{id}}",
        "CHANGE_PASSWORD": f"{API_PREFIX['USER']}/{{id}}/password",
        "ACTIVATE_BUSINESS": f"{API_PREFIX['USER']}/{{id}}/activate-business",
        "DEACTIVATE_BUSINESS": f"{API_PREFIX['USER']}/{{id}}/deactivate-business"
    },
    "PROXY": {
        "QUERY": f"{API_PREFIX['OPEN']}/product/query/{API_VERSION}",
        "STOCK": f"{API_PREFIX['OPEN']}/product/stock/{API_VERSION}",
        "BALANCE": f"{API_PREFIX['PROXY']}/balance",
        "FLOW_LOG": f"{API_PREFIX['PROXY']}/flow/log"
    },
    "AREA": {
        "LIST": f"{API_PREFIX['OPEN']}/area/{API_VERSION}",
        "STOCK": f"{API_PREFIX['OPEN']}/area/stock/{API_VERSION}",
        "CITY_LIST": f"{API_PREFIX['OPEN']}/city/list/{API_VERSION}"
    }
}

# 路由参数验证规则
ROUTE_PARAMS = {
    "USER": {
        "id": {
            "type": "integer",
            "required": True,
            "description": "用户ID"
        }
    },
    "PROXY": {
        "type": {
            "type": "string",
            "required": True,
            "enum": ["dynamic", "static"],
            "description": "代理类型"
        }
    }
}

# 路由权限配置
ROUTE_PERMISSIONS = {
    "USER": {
        "CREATE": ["admin", "agent"],
        "UPDATE": ["admin", "owner"],
        "DELETE": ["admin"],
        "CHANGE_PASSWORD": ["admin", "owner"]
    },
    "PROXY": {
        "QUERY": ["admin", "agent", "user"],
        "STOCK": ["admin", "agent"],
        "BALANCE": ["admin", "owner"]
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