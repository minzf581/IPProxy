import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import { UserRole } from '@/types/user';
import { debug } from '@/utils/debug';

const { request: debugRequest } = debug;

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json;charset=UTF-8'
  }
});

// 导出 api 作为 request 的别名
export const api = request;

// Mock 数据
const mockData: Record<string, any> = {
  '/auth/login': {
    code: 0,
    message: 'success',
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
    code: 0,
    message: 'success',
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

interface MockResponse {
  isAxiosMockResponse: boolean;
  response: {
    data: any;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: any;
  };
}

interface APIResponse {
  code: number;
  message: string;
  data: any;
}

// 检查是否有对应的 mock 数据
const hasMockData = (url: string): boolean => {
  return import.meta.env.VITE_API_MOCK && !!mockData[url];
};

// 获取 mock 数据
const getMockData = (url: string): any => {
  return mockData[url];
};

// 请求拦截器
request.interceptors.request.use(
  async (config) => {
    debugRequest.group('Request Interceptor');
    debugRequest.info('Starting request interceptor');
    debugRequest.request(config);

    const token = localStorage.getItem('token');
    const hasToken = !!token;

    if (hasToken) {
      config.headers.Authorization = `Bearer ${token}`;
      debugRequest.info('Added token to request headers');
    } else {
      debugRequest.warn('No token found in localStorage');
    }

    // 检查是否需要返回 mock 数据
    if (config.url && hasMockData(config.url)) {
      debugRequest.info('Using mock data for:', config.url);
      debugRequest.groupEnd();
      return Promise.reject({
        isAxiosMockResponse: true,
        response: {
          data: getMockData(config.url),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config,
        }
      } as MockResponse);
    }

    debugRequest.info('Request will be sent to server');
    debugRequest.groupEnd();
    return config;
  },
  (error) => {
    debugRequest.group('Request Interceptor Error');
    debugRequest.error('Error in request interceptor');
    debugRequest.logError(error);
    debugRequest.groupEnd();
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    debugRequest.group('Response Interceptor');
    debugRequest.info('Starting response interceptor');
    debugRequest.response(response);

    const { data } = response;

    // 如果是 mock 数据，直接返回
    if (import.meta.env.VITE_API_MOCK) {
      debugRequest.info('Using mock data');
      debugRequest.groupEnd();
      return response;
    }

    // 检查响应状态
    if (data.code && data.code !== 0 && data.code !== 200) {
      debugRequest.error('API error response:', data);
      message.error(data.message || '请求失败');
      debugRequest.groupEnd();
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    debugRequest.info('Response processed successfully');
    debugRequest.groupEnd();
    return response;
  },
  (error: AxiosError | MockResponse) => {
    debugRequest.group('Response Error Handler');

    // 检查是否是 mock 响应
    if ('isAxiosMockResponse' in error && error.isAxiosMockResponse) {
      debugRequest.info('Processing mock response');
      debugRequest.log('Mock response data:', error.response.data);
      debugRequest.groupEnd();
      return error.response;
    }

    if (axios.isAxiosError(error)) {
      debugRequest.error('Axios error occurred');
      debugRequest.logError(error);

      if (!error.response) {
        debugRequest.error('Network error - no response received');
        message.error('网络错误，请检查网络连接');
        debugRequest.groupEnd();
        return Promise.reject(error);
      }

      const { response } = error;
      const data = response.data as APIResponse;

      // 处理不同的错误状态码
      switch (response.status) {
        case 401:
          debugRequest.warn('401 Unauthorized - redirecting to login');
          message.error('未登录或登录已过期');
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          debugRequest.warn('403 Forbidden - access denied');
          message.error('没有权限访问该资源');
          break;
        case 404:
          debugRequest.warn('404 Not Found - resource does not exist');
          message.error('请求的资源不存在');
          break;
        case 500:
          debugRequest.error('500 Server Error');
          message.error('服务器错误，请稍后重试');
          break;
        default:
          debugRequest.error(`Unexpected error status: ${response.status}`);
          message.error(data?.message || '未知错误，请稍后重试');
      }
    }

    debugRequest.groupEnd();
    return Promise.reject(error);
  }
);

export { request };