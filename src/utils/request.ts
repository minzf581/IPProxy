import axios from 'axios';
import { message } from 'antd';
import { UserRole } from '@/types/user';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[Request Debug]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[Request Error]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[Request Warning]', ...args);
  }
};

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Mock 数据
const mockData: Record<string, any> = {
  '/auth/login': {
    code: 200,
    msg: 'success',
    data: {
      token: 'admin_token',
      user: {
        id: '1',
        username: 'ipadmin',
        role: UserRole.ADMIN,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z'
      }
    }
  },
  '/auth/current-user': {
    code: 200,
    msg: 'success',
    data: {
      id: '1',
      username: 'ipadmin',
      role: UserRole.ADMIN,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z'
    }
  },
  '/statistics': {
    code: 200,
    msg: 'success',
    data: {
      // 财务数据
      totalRecharge: 168880,
      totalConsumption: 17780,
      balance: 151100,
      monthlyRecharge: 28660,
      monthlyConsumption: 8520,
      lastMonthConsumption: 9260,
      
      // 动态资源数据
      dynamic1: {
        total: 1024,
        monthly: 256,
        daily: 28,
        lastMonth: 320,
        percent: 50
      },
      dynamic2: {
        total: 2048,
        monthly: 512,
        daily: 64,
        lastMonth: 486,
        percent: 75
      },
      dynamic3: {
        total: 4096,
        monthly: 1024,
        daily: 128,
        lastMonth: 896,
        percent: 25
      },
      
      // 静态资源数据
      static1: {
        total: 1000,
        monthlyAvailable: 200,
        remainingAvailable: 300,
        lastMonth: 180,
        used: 120,
        percent: 60
      },
      static2: {
        total: 2000,
        monthlyAvailable: 400,
        remainingAvailable: 600,
        lastMonth: 380,
        used: 220,
        percent: 80
      },
      static3: {
        total: 3000,
        monthlyAvailable: 600,
        remainingAvailable: 900,
        lastMonth: 550,
        used: 350,
        percent: 40
      }
    }
  }
};

// 检查是否有对应的 mock 数据
const hasMockData = (url: string): boolean => {
  return !!mockData[url];
};

// 获取 mock 数据
const getMockData = (url: string): any => {
  return mockData[url];
};

// 请求拦截器
request.interceptors.request.use(
  async (config) => {
    debug.log('Request interceptor start:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      params: config.params
    });

    const token = localStorage.getItem('token');
    const hasToken = !!token;

    if (hasToken) {
      config.headers.Authorization = `Bearer ${token}`;
      debug.log('Added token to request');
    } else {
      debug.warn('No token found in localStorage');
    }

    // 检查是否需要返回 mock 数据
    if (config.url && hasMockData(config.url)) {
      debug.log('Using mock data for:', config.url);
      return Promise.reject({
        isAxiosMockResponse: true,
        response: {
          data: getMockData(config.url),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config,
        }
      });
    }

    debug.log('Request will be sent to server');
    return config;
  },
  (error) => {
    debug.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    debug.log('Response success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    // 检查是否是 mock 响应
    if (error.isAxiosMockResponse) {
      debug.log('Returning mock response:', error.response.data);
      return error.response;
    }

    debug.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      error
    });

    if (!error.response) {
      debug.error('Network error:', error);
      message.error('网络错误，请检查网络连接');
      return Promise.reject(error);
    }

    const { response } = error;

    // 处理不同的错误状态码
    switch (response.status) {
      case 401:
        debug.warn('Unauthorized access, redirecting to login');
        message.error('未登录或登录已过期');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;
      case 403:
        debug.warn('Forbidden access');
        message.error('没有权限访问该资源');
        break;
      case 404:
        debug.warn('Resource not found');
        message.error('请求的资源不存在');
        break;
      case 500:
        debug.error('Server error');
        message.error('服务器错误，请稍后重试');
        break;
      default:
        debug.error('Unknown error:', response.status);
        message.error(response.data?.message || '未知错误，请稍后重试');
    }

    return Promise.reject(error);
  }
);

export { request };