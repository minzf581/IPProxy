/**
 * 共享的 API 路由配置
 * 前后端都使用这个文件来保持路由一致性
 */

export const API_ROUTES = {
  AREA: {
    /** 获取区域列表 */
    LIST: 'open/app/area/v2',
    /** 获取区域库存 */
    STOCK: 'open/app/area/stock/v2'
  },
  COUNTRY: {
    /** 获取国家列表 */
    LIST: 'open/app/country/list/v2'
  },
  CITY: {
    /** 获取城市列表 */
    LIST: 'open/app/city/list/v2'
  },
  PRODUCT: {
    /** 查询产品列表 */
    QUERY: 'open/app/product/query/v2',
    /** 查询产品库存 */
    STOCK: 'open/app/product/stock/v2'
  },
  AUTH: {
    /** 登录 */
    LOGIN: 'auth/login',
    /** 登出 */
    LOGOUT: 'auth/logout'
  },
  USER: {
    /** 获取用户信息 */
    INFO: 'user/info',
    /** 更新用户信息 */
    UPDATE: 'user/update'
  },
  PROXY: {
    /** 获取代理信息 */
    INFO: 'proxy/info',
    /** 获取代理余额 */
    BALANCE: 'proxy/balance',
    /** 获取流量使用记录 */
    FLOW_USE_LOG: 'proxy/flow/use/log'
  }
} as const;

// 为了方便 Python 使用，导出一个常量字符串版本
export const ROUTES_PY = `
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
`; 