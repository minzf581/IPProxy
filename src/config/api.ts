/**
 * API配置文件
 * 
 * 此文件定义了所有API相关的配置，包括：
 * - API基础路径
 * - API版本
 * - 各模块的API路径
 * 
 * 重要提示：
 * 1. 所有API路径都以/api开头
 * 2. 修改路径时需同步修改后端对应的路由
 * 3. 保持与后端路由定义的一致性
 * 
 * 后端对应：
 * - 主应用：backend/app/main.py
 * - 路由定义：backend/app/routers/*.py
 */

// API 基础路径配置
export const API_BASE_URL = '/api';

// API 版本
export const API_VERSION = 'v2';

/**
 * API 路径配置
 * 
 * 注意事项：
 * 1. 修改路径时需同步更新：
 *    - 后端路由文件
 *    - 前端服务层代码
 *    - API文档
 * 2. 保持命名规范的一致性
 * 3. 确保路径前缀正确
 */
export const API_PATHS = {
  // 认证相关
  AUTH: {
    LOGIN: 'auth/login',      // 对应 auth.py
    LOGOUT: 'auth/logout'     // 对应 auth.py
  },

  // 应用信息相关
  APP: {
    INFO: 'open/app/info/v2',           // 对应 app.py
    PRODUCT: 'open/app/product/v2'      // 对应 product.py
  },

  // 代理相关
  PROXY: {
    INFO: 'open/app/proxy/info/v2',           // 对应 proxy.py
    BALANCE: 'open/app/proxy/balance/v2',     // 对应 proxy.py
    DRAW_API: 'open/app/proxy/draw/api/v2',   // 对应 proxy.py
    DRAW_PWD: 'open/app/proxy/draw/pwd/v2',   // 对应 proxy.py
    RETURN: 'open/app/proxy/return/v2',       // 对应 proxy.py
    ADD_IP_WHITELIST: 'open/app/proxy/whitelist/add/v2',    // 对应 proxy.py
    DEL_IP_WHITELIST: 'open/app/proxy/whitelist/delete/v2', // 对应 proxy.py
    FLOW_USE_LOG: 'open/app/proxy/flow/log/v2'             // 对应 proxy.py
  },

  // 用户相关
  USER: {
    MANAGE: 'user/list',    // 对应 user.py 的 get_user_list
    AUTH: 'user/auth',      // 对应 user.py 的 auth_user
    CREATE: 'user/create',  // 对应 user.py 的 create_user
    UPDATE: 'user/update',  // 对应 user.py 的 update_user
    DELETE: 'user/delete',  // 对应 user.py 的 delete_user
    ACTIVATE: 'user/{id}/activate-business',  // 对应 user.py 的 activate_business
    PROFILE: 'user/profile' // 对应 user.py 的 get_user_profile
  },

  // 订单相关
  ORDER: {
    MANAGE: 'open/app/order/manage/v2'  // 对应 order.py
  },

  // 实例相关
  INSTANCE: {
    MANAGE: 'open/app/instance/v2',          // 对应 instance.py
    OPEN: 'open/app/instance/open/v2',       // 对应 instance.py
    RENEW: 'open/app/instance/renew/v2',     // 对应 instance.py
    RELEASE: 'open/app/instance/release/v2',  // 对应 instance.py
    OPEN_ASSIGN_IP: 'open/app/assign/ip/info/v2'  // 对应 instance.py
  },

  // 区域相关
  REGION: {
    AREA: 'open/app/area/v2',              // 对应 area.py
    CITY: 'open/app/city/list/v2',         // 对应 area.py
    IP_RANGES: 'open/app/area/ip-ranges/v2' // 对应 area.py
  },

  // 仪表盘相关
  DASHBOARD: {
    INFO: '/open/app/dashboard/info/v2'  // 对应 dashboard.py
  },

  // 代理商相关
  AGENT: {
    LIST: '/open/app/agent/list'  // 对应 agent.py
  }
};

/**
 * API 请求配置
 * 
 * 注意事项：
 * 1. 修改配置时需考虑影响范围
 * 2. 保持与后端配置的一致性
 * 3. 敏感信息应使用环境变量
 */
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
