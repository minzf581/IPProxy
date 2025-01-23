import { api } from '@/utils/request';
import { message } from 'antd';
import { debug } from '@/utils/debug';
import { request } from '@/utils/request';

// 使用预定义的 dashboard 命名空间
const logger = debug.dashboard;

export interface ProxyInfo {
  balance: number;
  total_recharge: number;
  total_consumption: number;
  month_recharge: number;
  month_consumption: number;
  last_month_consumption: number;
  dynamic_resources: Array<{
    title: string;
    total: string;
    used: string;
    today: string;
    lastMonth: string;
    percentage: number;
  }>;
  static_resources: Array<{
    title: string;
    total: string;
    used: string;
    today: string;
    lastMonth: string;
    available: string;
    percentage: number;
  }>;
}

export interface ResourceInfo {
  title: string;
  total: number;
  used: number;
  today: number;
  last_month: number;
  percentage: number;
}

export interface StaticResourceInfo extends ResourceInfo {
  available: number;
}

export interface FlowUsageLog {
  month_consumption: number;
  last_month_consumption: number;
}

export interface BackendResponse {
  app_info: {
    residential: {
      balance: number;
      updated_at: string;
    };
    datacenter: {
      balance: number;
      updated_at: string;
    };
  };
  statistics: {
    monthlyUsage: number;
    dailyUsage: number;
    lastMonthUsage: number;
    updated_at: string;
  };
  instance_stats: {
    total: number;
    active: number;
    inactive: number;
  };
  flow_stats: {
    total: number;
    used: number;
    remaining: number;
  };
}

export interface DashboardData {
  statistics: {
    balance: number;
    total_recharge: number;
    total_consumption: number;
    monthly_recharge: number;
    monthly_consumption: number;
    last_month_consumption: number;
  };
  dynamic_resources: Array<{
    name: string;
    total_usage: number;
    monthly_usage: number;
    daily_usage: number;
    last_month_usage: number;
    usage_rate: number;
  }>;
  static_resources: Array<{
    name: string;
    total_opened: number;
    monthly_opened: number;
    last_month_opened: number;
    available: number;
    expired: number;
    usage_rate: number;
  }>;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 预设的默认资源数据
const defaultDashboardData: DashboardData = {
  statistics: {
    balance: 0,
    total_recharge: 0,
    total_consumption: 0,
    monthly_recharge: 0,
    monthly_consumption: 0,
    last_month_consumption: 0,
  },
  dynamic_resources: [
    {
      name: '动态资源1',
      total_usage: 1024,
      monthly_usage: 0,
      daily_usage: 0,
      last_month_usage: 0,
      usage_rate: 50
    },
    {
      name: '动态资源2',
      total_usage: 2048,
      monthly_usage: 0,
      daily_usage: 0,
      last_month_usage: 0,
      usage_rate: 75
    },
    {
      name: '动态资源3',
      total_usage: 4096,
      monthly_usage: 0,
      daily_usage: 0,
      last_month_usage: 0,
      usage_rate: 25
    }
  ],
  static_resources: [
    {
      name: '静态资源1',
      total_opened: 1000,
      monthly_opened: 0,
      last_month_opened: 0,
      available: 300,
      expired: 0,
      usage_rate: 60
    },
    {
      name: '静态资源2',
      total_opened: 2000,
      monthly_opened: 0,
      last_month_opened: 0,
      available: 600,
      expired: 0,
      usage_rate: 80
    },
    {
      name: '静态资源3',
      total_opened: 3000,
      monthly_opened: 0,
      last_month_opened: 0,
      available: 900,
      expired: 0,
      usage_rate: 40
    },
    {
      name: '静态资源4',
      total_opened: 1500,
      monthly_opened: 0,
      last_month_opened: 0,
      available: 450,
      expired: 0,
      usage_rate: 55
    },
    {
      name: '静态资源5',
      total_opened: 2500,
      monthly_opened: 0,
      last_month_opened: 0,
      available: 750,
      expired: 0,
      usage_rate: 70
    },
    {
      name: '静态资源7',
      total_opened: 3500,
      monthly_opened: 0,
      last_month_opened: 0,
      available: 1050,
      expired: 0,
      usage_rate: 45
    }
  ]
};

// 将后端数据转换为前端所需的格式
function transformBackendData(backendData: BackendResponse): DashboardData {
  // 如果后端返回的数据不完整，使用默认数据
  if (!backendData) {
    return defaultDashboardData;
  }

  return {
    statistics: {
      balance: backendData.app_info.residential.balance + backendData.app_info.datacenter.balance,
      total_recharge: 0,
      total_consumption: 0,
      monthly_recharge: backendData.statistics.monthlyUsage,
      monthly_consumption: backendData.statistics.dailyUsage,
      last_month_consumption: backendData.statistics.lastMonthUsage,
    },
    dynamic_resources: defaultDashboardData.dynamic_resources,
    static_resources: defaultDashboardData.static_resources
  };
}

export async function getProxyInfo(): Promise<DashboardData> {
  try {
    logger.log('Fetching proxy info...');
    const response = await api.get<ApiResponse<DashboardData>>('/api/open/app/dashboard/info/v2');
    logger.log('Proxy info response:', response.data);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching proxy info:', error);
    throw error;
  }
}

async function getFlowUsageLog(): Promise<FlowUsageLog> {
  try {
    const response = await api.get<ApiResponse<FlowUsageLog>>('/api/open/app/dashboard/statistics/v2');
    return response.data.data;
  } catch (error) {
    console.error('Error in getFlowUsageLog:', error);
    throw error;
  }
}

// 计算使用率百分比
function calculatePercentage(used: number, total: number): number {
  if (total <= 0) return 0;
  return (used / total) * 100;
}

export async function getDashboardData(agentId?: string): Promise<DashboardData> {
  const url = agentId ? `/api/open/app/dashboard/info/v2?agent_id=${agentId}` : '/api/open/app/dashboard/info/v2';
  const { data } = await request<ApiResponse<DashboardData>>(url);
  if (data.code === 0) {
    return data.data;
  }
  throw new Error(data.message);
}

export async function getDashboardStatistics(): Promise<{
  month_consumption: number;
  last_month_consumption: number;
}> {
  try {
    logger.log('Fetching dashboard statistics...');
    const response = await api.get<ApiResponse<{
      month_consumption: number;
      last_month_consumption: number;
    }>>('/api/open/app/dashboard/statistics');
    logger.log('Dashboard statistics response:', response.data);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching dashboard statistics:', error);
    throw error;
  }
}
