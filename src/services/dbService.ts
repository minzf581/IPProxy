import api from '../utils/db';
import { API_PATHS, API_VERSION } from '../config/api';

// User Services
export const userService = {
  // 获取用户信息
  getCurrentUser: async () => {
    const response = await api.get(`${API_PATHS.USER.INFO}/${API_VERSION}`);
    return response.data;
  },

  // 获取用户列表
  getUsers: async (params: { page: number; pageSize: number }) => {
    const response = await api.get(`${API_PATHS.USER.LIST}/${API_VERSION}`, { params });
    return response.data;
  },

  // 更新用户密码
  updatePassword: async (userId: number, oldPassword: string, newPassword: string) => {
    const response = await api.put(`${API_PATHS.USER.UPDATE_PASSWORD}/${API_VERSION}`, {
      userId,
      oldPassword,
      newPassword
    });
    return response.data;
  }
};

// Agent Services
export const agentService = {
  // 获取代理商信息
  getAgent: async (agentId: number) => {
    const response = await api.get(`${API_PATHS.AGENT.INFO}/${API_VERSION}/${agentId}`);
    return response.data;
  },

  // 获取代理商列表
  getAgents: async (params: { page: number; pageSize: number }) => {
    const response = await api.get(`${API_PATHS.AGENT.LIST}/${API_VERSION}`, { params });
    return response.data;
  },

  // 更新代理商余额
  updateBalance: async (agentId: number, amount: number) => {
    const response = await api.put(`${API_PATHS.AGENT.UPDATE_BALANCE}/${API_VERSION}`, {
      agentId,
      amount
    });
    return response.data;
  }
};

// Resource Services
export const resourceService = {
  // 获取动态资源列表
  getDynamicResources: async (params: { page: number; pageSize: number }) => {
    const response = await api.get(`${API_PATHS.RESOURCE.DYNAMIC.LIST}/${API_VERSION}`, { params });
    return response.data;
  },

  // 获取静态资源列表
  getStaticResources: async (params: {
    page: number;
    pageSize: number;
    country?: string;
    region?: string;
  }) => {
    const response = await api.get(`${API_PATHS.RESOURCE.STATIC.LIST}/${API_VERSION}`, { params });
    return response.data;
  },

  // 获取资源统计信息
  getResourceStats: async () => {
    const response = await api.get(`${API_PATHS.RESOURCE.STATS}/${API_VERSION}`);
    return response.data;
  }
};

// Order Services
export const orderService = {
  // 获取动态订单列表
  getDynamicOrders: async (params: { page: number; pageSize: number; userId?: string; status?: string }) => {
    const response = await api.get(`${API_PATHS.ORDER.DYNAMIC.LIST}/${API_VERSION}`, { params });
    return response.data;
  },

  // 获取静态订单列表
  getStaticOrders: async (params: { page: number; pageSize: number; userId?: string; status?: string }) => {
    const response = await api.get(`${API_PATHS.ORDER.STATIC.LIST}/${API_VERSION}`, { params });
    return response.data;
  },

  // 创建动态IP订单
  createDynamicOrder: async (data: {
    userId: number;
    agentId: number;
    duration: number;
  }) => {
    const response = await api.post(`${API_PATHS.ORDER.DYNAMIC.CREATE}/${API_VERSION}`, data);
    return response.data;
  },

  // 创建静态IP订单
  createStaticOrder: async (data: {
    userId: number;
    agentId: number;
    resourceType: string;
    location?: string;
  }) => {
    const response = await api.post(`${API_PATHS.ORDER.STATIC.CREATE}/${API_VERSION}`, data);
    return response.data;
  }
};

// Pricing Services
export const pricingService = {
  // 获取资源价格
  getPricing: async (params: {
    resourceType: string;
    agentId?: number;
  }) => {
    const response = await api.get(`${API_PATHS.PRICING}/${API_VERSION}`, { params });
    return response.data;
  },

  // 更新资源价格
  updatePricing: async (data: {
    resourceId: number;
    price: number;
  }) => {
    const response = await api.put(`${API_PATHS.PRICING}/${API_VERSION}`, data);
    return response.data;
  }
};

// Usage Log Services
export const usageLogService = {
  // 获取资源使用记录
  getUsageLogs: async (params: {
    page: number;
    pageSize: number;
    resourceType: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get(`${API_PATHS.USAGE_LOG}/${API_VERSION}`, { params });
    return response.data;
  },

  // 创建使用记录
  createUsageLog: async (data: {
    resourceId: number;
    userId: number;
    agentId: number;
  }) => {
    const response = await api.post(`${API_PATHS.USAGE_LOG}/${API_VERSION}`, data);
    return response.data;
  }
};
