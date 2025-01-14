import { request } from '@/utils/request';
import type { User } from '@/types/user';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface StatisticsData {
  // 财务数据
  totalRecharge: number;
  totalConsumption: number;
  balance: number;
  monthlyRecharge: number;
  monthlyConsumption: number;
  lastMonthConsumption: number;
  
  // 动态资源数据
  dynamic1: {
    total: number;
    monthly: number;
    daily: number;
    lastMonth: number;
    percent: number;
  };
  dynamic2: {
    total: number;
    monthly: number;
    daily: number;
    lastMonth: number;
    percent: number;
  };
  dynamic3: {
    total: number;
    monthly: number;
    daily: number;
    lastMonth: number;
    percent: number;
  };
  
  // 静态资源数据
  static1: {
    total: number;
    monthlyAvailable: number;
    remainingAvailable: number;
    lastMonth: number;
    used: number;
    percent: number;
  };
  static2: {
    total: number;
    monthlyAvailable: number;
    remainingAvailable: number;
    lastMonth: number;
    used: number;
    percent: number;
  };
  static3: {
    total: number;
    monthlyAvailable: number;
    remainingAvailable: number;
    lastMonth: number;
    used: number;
    percent: number;
  };
}

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    console.log('[LocalDB Service Debug]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[LocalDB Service Error]', ...args);
  }
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  debug.log('Login request:', { username });
  const response = await request.post<ApiResponse<LoginResponse>>('/auth/login', { username, password });
  debug.log('Login response:', { code: response.data.code, msg: response.data.msg });
  
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  
  return response.data.data;
};

export const getCurrentUser = async (): Promise<User> => {
  debug.log('Getting current user');
  const response = await request.get<ApiResponse<User>>('/auth/current-user');
  debug.log('Current user response:', { code: response.data.code, msg: response.data.msg });
  
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  
  return response.data.data;
};

export const getStatistics = async (): Promise<StatisticsData> => {
  debug.log('Getting statistics');
  const response = await request.get<ApiResponse<StatisticsData>>('/statistics');
  debug.log('Statistics response:', { code: response.data.code, msg: response.data.msg });
  
  if (response.data.code !== 200) {
    throw new Error(response.data.msg);
  }
  
  return response.data.data;
};