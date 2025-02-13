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
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// API 模块前缀
export const API_PREFIX = {
  OPEN: '/open/app',
  AUTH: '/api/auth',
  USER: '/user',
  ADMIN: '/admin',
  PROXY: '/proxy'
} as const;

// 打印调试信息的函数
function logDebugInfo() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Routes Config]', {
      API_VERSION,
      API_BASE,
      API_PREFIX,
    });
  }
}

// 只在开发环境下执行调试日志
if (process.env.NODE_ENV === 'development') {
  logDebugInfo();
}

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
    PROFILE: `${API_PREFIX.AUTH}/current-user`
  },

  USER: {
    CREATE: `${API_PREFIX.OPEN}/user/create/v2`,
    LIST: `${API_PREFIX.USER}/list`,
    UPDATE: `${API_PREFIX.USER}/{id}`,
    DELETE: `${API_PREFIX.USER}/{id}`,
    CHANGE_PASSWORD: `${API_PREFIX.USER}/{id}/password`,
    ACTIVATE_BUSINESS: `${API_PREFIX.USER}/{id}/activate-business`,
    DEACTIVATE_BUSINESS: `${API_PREFIX.USER}/{id}/deactivate-business`
  },

  ORDER: {
    CREATE: `${API_PREFIX.OPEN}/order/create/v2`,
    LIST: `${API_PREFIX.OPEN}/order/list/v2`,
    DETAIL: `${API_PREFIX.OPEN}/order/detail/v2`,
    CANCEL: `${API_PREFIX.OPEN}/order/cancel/v2`,
    STATIC: {
      LIST: `${API_PREFIX.OPEN}/static/order/list/v2`,
      CREATE: `${API_PREFIX.OPEN}/static/order/create/v2`,
      DETAIL: `${API_PREFIX.OPEN}/static/order/detail/v2`,
      STATUS: `${API_PREFIX.OPEN}/static/order/status/v2`
    }
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
  },

  SETTINGS: {
    AGENT: {
      PRICES: {
        GET: (id: string) => `/settings/agent/${id}/prices`,
        UPDATE: (id: string) => `/settings/agent/${id}/prices`
      }
    },
    PRODUCT: {
      PRICES: {
        IMPORT: '/product/prices/import',
        BATCH_IMPORT: '/product/prices/batch-import',
        EXPORT: '/product/prices/export'
      }
    }
  },

  AGENT: {
    LIST: `${API_PREFIX.OPEN}/agent/list`,
    CREATE: `${API_PREFIX.OPEN}/proxy/user/v2`,
    UPDATE: `${API_PREFIX.OPEN}/agent/{id}`,
    DELETE: `${API_PREFIX.OPEN}/agent/{id}`,
    ORDERS: `${API_PREFIX.OPEN}/agent-orders/v2`,
    PRICES: {
      GET: (id: string) => `${API_PREFIX.ADMIN}/agent/${id}/prices`,
      UPDATE: (id: string) => `${API_PREFIX.ADMIN}/agent/${id}/prices`
    }
  },
} as const;

// 调试日志
if (process.env.NODE_ENV === 'development') {
  console.log('[Routes Config] Generated Routes:', {
    AUTH: API_ROUTES.AUTH,
    USER: API_ROUTES.USER,
    ORDER: API_ROUTES.ORDER,
    PROXY: API_ROUTES.PROXY,
    AREA: API_ROUTES.AREA,
    SETTINGS: API_ROUTES.SETTINGS
  });
}

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
        "PROFILE": f"{API_PREFIX['AUTH']}/current-user"
    },
    "USER": {
        "CREATE": f"{API_PREFIX['OPEN']}/user/create/v2",
        "LIST": f"{API_PREFIX['USER']}/list",
        "UPDATE": f"{API_PREFIX['USER']}/{{id}}",
        "DELETE": f"{API_PREFIX['USER']}/{{id}}",
        "CHANGE_PASSWORD": f"{API_PREFIX['USER']}/{{id}}/password",
        "ACTIVATE_BUSINESS": f"{API_PREFIX['USER']}/{{id}}/activate-business",
        "DEACTIVATE_BUSINESS": f"{API_PREFIX['USER']}/{{id}}/deactivate-business"
    },
    "ORDER": {
        "CREATE": f"{API_PREFIX['OPEN']}/order/create/v2",
        "LIST": f"{API_PREFIX['OPEN']}/order/list/v2",
        "DETAIL": f"{API_PREFIX['OPEN']}/order/detail/v2",
        "CANCEL": f"{API_PREFIX['OPEN']}/order/cancel/v2",
        "STATIC": {
            "LIST": f"{API_PREFIX['OPEN']}/static/order/list/v2",
            "CREATE": f"{API_PREFIX['OPEN']}/static/order/create/v2",
            "DETAIL": f"{API_PREFIX['OPEN']}/static/order/detail/v2",
            "STATUS": f"{API_PREFIX['OPEN']}/static/order/status/v2"
        }
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
    },
    "SETTINGS": {
        "AGENT": {
            "PRICES": {
                "GET": lambda id: f"{API_PREFIX['ADMIN']}/settings/agent/{id}/prices",
                "UPDATE": lambda id: f"{API_PREFIX['ADMIN']}/settings/agent/{id}/prices"
            }
        },
        "PRODUCT": {
            "PRICES": {
                "IMPORT": "/product/prices/import",
                "BATCH_IMPORT": "/product/prices/batch-import",
                "EXPORT": "/product/prices/export"
            }
        }
    },
    "AGENT": {
        "LIST": f"{API_PREFIX['OPEN']}/agent/list",
        "CREATE": f"{API_PREFIX['OPEN']}/proxy/user/v2",
        "UPDATE": f"{API_PREFIX['OPEN']}/agent/{{id}}",
        "DELETE": f"{API_PREFIX['OPEN']}/agent/{{id}}",
        "ORDERS": f"{API_PREFIX['OPEN']}/agent-orders/v2",
        "PRICES": {
            "GET": lambda id: f"{API_PREFIX['ADMIN']}/agent/{id}/prices",
            "UPDATE": lambda id: f"{API_PREFIX['ADMIN']}/agent/{id}/prices"
        }
    }
}
`; 