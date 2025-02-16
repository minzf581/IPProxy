import request from '@/utils/request';
import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';
import type { DashboardData as DashboardDataType, AgentListResponse } from '@/types/dashboard';
import type { AxiosError } from 'axios';
import { API_ROUTES, API_PREFIX } from '@/shared/routes';

interface ErrorResponse {
  message?: string;
  msg?: string;
  data?: any;
}

// Debug 工具
const debug = {
  log: (...args: any[]) => {
    console.log('[Dashboard Service]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[Dashboard Service]', ...args);
  }
};

// 创建仪表盘服务专用的 axios 实例
const dashboardApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加认证拦截器
dashboardApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 确保URL包含/api前缀
  if (config.url && !config.url.startsWith('/api')) {
    config.url = `/api${config.url}`;
  }
  
  return config;
});

// 添加响应拦截器
dashboardApi.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    if (data.code === 0 || data.code === 200 || (data.data && !data.code)) {
      response.data = {
        code: 0,
        message: data.message || data.msg || '操作成功',
        data: data.data
      };
      return response;
    }
    throw new Error(data.message || data.msg || '请求失败');
  },
  (error: AxiosError<ErrorResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }
    throw new Error(error.response?.data?.message || error.response?.data?.msg || '请求失败');
  }
);

// 统计数据接口
export interface Statistics {
  totalRecharge: number;    // 累计充值
  totalConsumption: number; // 累计消费
  balance: number;          // 剩余金额
  monthRecharge: number;    // 本月充值
  monthConsumption: number; // 本月消费
  lastMonthConsumption: number; // 上月消费
}

// 动态资源接口
export interface DynamicResource {
  id: string;
  name: string;           // 资源名称
  usageRate: number;      // 使用率
  total: number;          // 累计使用量(GB)
  monthly: number;        // 本月使用量(GB)
  today: number;          // 今日使用量(GB)
  lastMonth: number;      // 上月使用量(GB)
}

// 静态资源接口
export interface StaticResource {
  id: string;
  name: string;           // 资源名称
  usageRate: number;      // 使用率
  total: number;          // 累计开通数量
  monthly: number;        // 本月开通数量
  lastMonth: number;      // 上月开通数量
  available: number;      // 剩余可用数量
  expired: number;        // 已过期数量
}

// 仪表盘数据接口
export interface DashboardData {
  agent: {
    id: number;
    username: string;
    balance: number;
  };
  statistics: {
    total_recharge: number;
    monthly_recharge: number;
    total_consumption: number;
    monthly_consumption: number;
    total_users: number;
    active_users: number;
    total_orders: number;
    monthly_orders: number;
  };
  recentOrders: any[];
  userGrowth: any[];
  revenueStats: any[];
  dynamicResources: DynamicResource[];
  staticResources: StaticResource[];
}

/**
 * 获取仪表盘数据
 * @param agentId 可选的代理商ID
 * @returns 仪表盘数据
 */
export async function getDashboardData(agentId?: string): Promise<ApiResponse<DashboardData>> {
  try {
    debug.log('获取仪表盘数据, agentId:', agentId);
    const url = agentId 
      ? `/api/dashboard/agent/${agentId}`
      : '/api/open/app/dashboard/info/v2';
    debug.log('请求URL:', url);
    
    const response = await request.get<ApiResponse<DashboardData>>(url);
    debug.log('仪表盘响应数据:', response.data);
    
    if (response.data.code !== 0) {
      throw new Error(response.data.msg || '获取仪表盘数据失败');
    }
    
    // 扩展响应数据，添加空的统计数组
    const extendedData: DashboardData = {
      ...response.data.data,
      recentOrders: [],
      userGrowth: [],
      revenueStats: [],
      dynamicResources: [],
      staticResources: []
    };
    
    return {
      code: 0,
      message: 'success',
      data: extendedData
    };
  } catch (error: unknown) {
    debug.error('获取仪表盘数据失败:', error);
    if (error instanceof Error) {
      throw new Error(error.message || '获取仪表盘数据失败');
    }
    throw new Error('获取仪表盘数据失败');
  }
}

// 格式化数字为千分位格式
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

// 格式化流量大小
export function formatTraffic(gb: number): string {
  return `${gb}Gb`;
}

// 格式化数量
export function formatCount(count: number): string {
  return `${count}条`;
}

// 格式化百分比
export function formatPercent(percent: number): string {
  return `${percent}%`;
}

export default {
  getDashboardData,
  formatNumber,
  formatTraffic,
  formatCount,
  formatPercent
}; 