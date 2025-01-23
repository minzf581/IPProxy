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

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 预设的默认资源数据
const defaultDashboardData: DashboardData = {
  balance: 0,
  total_recharge: 0,
  total_consumption: 0,
  month_recharge: 0,
  month_consumption: 0,
  last_month_consumption: 0,
  dynamic_resources: [
    {
      title: '动态资源1',
      total: '1024',
      used: '28',
      today: '256',
      lastMonth: '320',
      percentage: 50
    },
    {
      title: '动态资源2',
      total: '2048',
      used: '64',
      today: '512',
      lastMonth: '486',
      percentage: 75
    },
    {
      title: '动态资源3',
      total: '4096',
      used: '128',
      today: '1024',
      lastMonth: '896',
      percentage: 25
    }
  ],
  static_resources: [
    {
      title: '静态资源1',
      total: '1000',
      used: '120',
      today: '200',
      lastMonth: '180',
      available: '300',
      percentage: 60
    },
    {
      title: '静态资源2',
      total: '2000',
      used: '220',
      today: '400',
      lastMonth: '380',
      available: '600',
      percentage: 80
    },
    {
      title: '静态资源3',
      total: '3000',
      used: '350',
      today: '600',
      lastMonth: '550',
      available: '900',
      percentage: 40
    },
    {
      title: '静态资源4',
      total: '1500',
      used: '150',
      today: '300',
      lastMonth: '280',
      available: '450',
      percentage: 55
    },
    {
      title: '静态资源5',
      total: '2500',
      used: '250',
      today: '500',
      lastMonth: '480',
      available: '750',
      percentage: 70
    },
    {
      title: '静态资源7',
      total: '3500',
      used: '450',
      today: '700',
      lastMonth: '680',
      available: '1050',
      percentage: 45
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
    balance: backendData.app_info.residential.balance + backendData.app_info.datacenter.balance,
    total_recharge: 0,
    total_consumption: 0,
    month_recharge: 0,
    month_consumption: backendData.statistics.monthlyUsage,
    last_month_consumption: backendData.statistics.lastMonthUsage,
    // 保持预设的资源数据
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

export async function getDashboardData(): Promise<ApiResponse<DashboardData>> {
  const response = await request<ApiResponse<BackendResponse>>('/api/open/app/dashboard/info/v2');
  return {
    code: response.code,
    message: response.message,
    data: transformBackendData(response.data)
  };
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
