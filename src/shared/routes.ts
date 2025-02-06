/**
 * 共享的 API 路由配置
 * =================
 * 
 * 此文件定义了所有API路由，作为前后端的单一真实来源
 * 前端和后端都应该使用这个文件来保持路由的一致性
 */

// API 版本
export const API_VERSION = 'v2';

// API 基础路径
export const API_BASE = '/api';

// API 模块前缀
export const API_PREFIX = {
  OPEN: 'open/app',
  AUTH: 'auth',
  USER: 'user',
  ADMIN: 'admin',
  PROXY: 'proxy'
} as const;

/**
 * API 路由配置
 * 
 * 使用方式：
 * 1. 前端：直接导入 API_ROUTES 使用
 * 2. 后端：使用 ROUTES_PY 中的路由定义
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: `${API_PREFIX.AUTH}/login`,
    LOGOUT: `${API_PREFIX.AUTH}/logout`,
    REFRESH: `${API_PREFIX.AUTH}/refresh`,
    PROFILE: `${API_PREFIX.AUTH}/profile`
  },

  USER: {
    CREATE: `${API_PREFIX.OPEN}/user/create`,
    LIST: `${API_PREFIX.USER}/list`,
    UPDATE: `${API_PREFIX.USER}/{id}`,
    DELETE: `${API_PREFIX.USER}/{id}`,
    CHANGE_PASSWORD: `${API_PREFIX.USER}/{id}/password`,
    ACTIVATE_BUSINESS: `${API_PREFIX.USER}/{id}/activate-business`,
    DEACTIVATE_BUSINESS: `${API_PREFIX.USER}/{id}/deactivate-business`
  },

  PROXY: {
    QUERY: `${API_PREFIX.OPEN}/product/query/${API_VERSION}`,
    STOCK: `${API_PREFIX.OPEN}/product/stock/${API_VERSION}`,
    BALANCE: `${API_PREFIX.PROXY}/balance`,
    FLOW_LOG: `${API_PREFIX.PROXY}/flow/log`
  },

  AREA: {
    LIST: `${API_PREFIX.OPEN}/area/${API_VERSION}`,
    STOCK: `${API_PREFIX.OPEN}/area/stock/${API_VERSION}`,
    CITY_LIST: `${API_PREFIX.OPEN}/city/list/${API_VERSION}`,
    IP_RANGES: `${API_PREFIX.OPEN}/product/query/${API_VERSION}`
  }
} as const;

// 为了方便 Python 使用，导出一个常量字符串版本
export const ROUTES_PY = `
from typing import Dict, Any

API_VERSION = "${API_VERSION}"
API_BASE = "${API_BASE}"

API_PREFIX = {
    "OPEN": "${API_PREFIX.OPEN}",
    "AUTH": "${API_PREFIX.AUTH}",
    "USER": "${API_PREFIX.USER}",
    "ADMIN": "${API_PREFIX.ADMIN}",
    "PROXY": "${API_PREFIX.PROXY}"
}

API_ROUTES = {
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
        "CITY_LIST": f"{API_PREFIX['OPEN']}/city/list/{API_VERSION}",
        "IP_RANGES": f"{API_PREFIX['OPEN']}/product/query/{API_VERSION}"
    }
}
`; 