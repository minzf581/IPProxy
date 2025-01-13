// API 基础路径配置
export const API_BASE_URL = 'http://localhost:3001';

// API 版本
export const API_VERSION = 'v2';

// API 路径配置
export const API_PATHS = {
  // 用户相关
  USER: {
    LIST: '/api/open/app/user/list',
    CREATE: '/api/open/app/user/create',
    UPDATE: '/api/open/app/user/update',
    DELETE: '/api/open/app/user/delete',
    UPDATE_PASSWORD: '/api/open/app/user/password/update',
  },
  
  // 代理商相关
  AGENT: {
    LIST: '/api/open/app/agent/list',
    CREATE: '/api/open/app/agent/create',
    UPDATE: '/api/open/app/agent/update',
    DELETE: '/api/open/app/agent/delete',
    UPDATE_BALANCE: '/api/open/app/agent/balance/update',
  },

  // 订单相关
  ORDER: {
    DYNAMIC: {
      LIST: '/api/open/app/order/dynamic/list',
      CREATE: '/api/open/app/order/dynamic/create',
    },
    STATIC: {
      LIST: '/api/open/app/order/static/list',
      CREATE: '/api/open/app/order/static/create',
    },
  },

  // 资源相关
  RESOURCE: {
    DYNAMIC: {
      LIST: '/api/open/app/resource/dynamic/list',
    },
    STATIC: {
      LIST: '/api/open/app/resource/static/list',
    },
  },
};

// API 请求配置
export const API_CONFIG = {
  // 请求超时时间
  TIMEOUT: 10000,
  
  // 请求头
  HEADERS: {
    'Content-Type': 'application/json',
  },
};
