// API 基础路径配置
export const API_BASE_URL = 'http://localhost:8000/api';

// API 版本
export const API_VERSION = 'v2';

// API 路径配置
export const API_PATHS = {
  // 认证相关
  AUTH: {
    LOGIN: 'auth/login',
    LOGOUT: 'auth/logout'
  },

  // 应用信息相关
  APP: {
    INFO: 'open/app/info/v2',
    PRODUCT: 'open/app/product/v2'
  },

  // 代理相关
  PROXY: {
    INFO: 'settings/proxy/info',
    BALANCE: 'settings/proxy/balance',
    DRAW_API: 'settings/proxy/draw/api',
    DRAW_PWD: 'settings/proxy/draw/pwd',
    RETURN: 'settings/proxy/return',
    ADD_IP_WHITELIST: 'settings/proxy/whitelist/add',
    DEL_IP_WHITELIST: 'settings/proxy/whitelist/delete',
    FLOW_USE_LOG: 'settings/proxy/flow/log'
  },

  // 用户相关
  USER: {
    MANAGE: 'open/app/user/v2',
    AUTH: 'open/app/userAuth/v2'
  },

  // 订单相关
  ORDER: {
    MANAGE: 'open/app/order/manage/v2'
  },

  // 实例相关
  INSTANCE: {
    MANAGE: 'open/app/instance/v2',
    OPEN: 'open/app/instance/open/v2',
    RENEW: 'open/app/instance/renew/v2',
    RELEASE: 'open/app/instance/release/v2',
    OPEN_ASSIGN_IP: 'open/app/assign/ip/info/v2'
  },

  // 区域相关
  REGION: {
    AREA: 'settings/regions',
    PRODUCT_AREA: 'settings/product-areas',
    CITY: 'settings/cities',
    IP_INFO: 'settings/ip-info',
    IP_STOCK: 'settings/ip-stock'
  }
};

// API 请求配置
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json'
  },
  APP_KEY: 'AK20241120145620',
  APP_SECRET: 'bf3ffghlt0hpc4omnvc2583jt0fag6a4',
  version: 'v2',
  encrypt: 'AES'
};
