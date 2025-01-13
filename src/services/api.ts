import api from '../utils/db';

// User API
export const userAPI = {
  getCurrentUser: () => api.get('/api/users/current'),
  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put('/api/users/password', data),
  getUsers: (params: { page: number; pageSize: number }) =>
    api.get('/api/users', { params }),
};

// Agent API
export const agentAPI = {
  getAgentInfo: () => api.get('/api/agents/current'),
  updateBalance: (data: { amount: number }) =>
    api.put('/api/agents/balance', data),
  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put('/api/agents/password', data),
  getAgents: (params: { page: number; pageSize: number }) =>
    api.get('/api/agents', { params }),
};

// Resource API
export const resourceAPI = {
  // Dynamic Resources
  getDynamicResources: (params: { page: number; pageSize: number }) =>
    api.get('/api/resources/dynamic', { params }),
  getDynamicResourceStats: () => 
    api.get('/api/resources/dynamic/stats'),
  
  // Static Resources
  getStaticResources: (params: { 
    page: number; 
    pageSize: number;
    country?: string;
    region?: string;
    city?: string;
  }) => api.get('/api/resources/static', { params }),
  getStaticResourceStats: () => 
    api.get('/api/resources/static/stats'),
};

// Orders API
export const orderAPI = {
  // Dynamic IP Orders
  getDynamicOrders: (params: { 
    page: number; 
    pageSize: number;
    status?: 'pending' | 'paid';
  }) => api.get('/api/orders/dynamic', { params }),
  createDynamicOrder: (data: {
    duration: number;
  }) => api.post('/api/orders/dynamic', data),
  
  // Static IP Orders
  getStaticOrders: (params: { 
    page: number; 
    pageSize: number;
    status?: 'active' | 'expired';
  }) => api.get('/api/orders/static', { params }),
  createStaticOrder: (data: {
    resourceType: string;
    location?: string;
  }) => api.post('/api/orders/static', data),
};

// Pricing API
export const pricingAPI = {
  getPricing: (params: {
    resourceType: 'dynamic' | 'static';
    agentId?: number;
  }) => api.get('/api/pricing', { params }),
  updatePricing: (data: {
    resourceName: string;
    resourceType: 'dynamic' | 'static';
    pricePerUnit: number;
  }) => api.put('/api/pricing', data),
};

// Statistics API
export const statisticsAPI = {
  getResourceUsage: (params: {
    startDate: string;
    endDate: string;
    resourceType: 'dynamic' | 'static';
  }) => api.get('/api/statistics/usage', { params }),
  getOrderStats: (params: {
    startDate: string;
    endDate: string;
    orderType: 'dynamic' | 'static';
  }) => api.get('/api/statistics/orders', { params }),
  getSystemStats: () => api.get('/api/statistics/system'),
};
