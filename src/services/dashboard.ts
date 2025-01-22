import { api } from '@/utils/request';
import { message } from 'antd';
import { debug } from '@/utils/debug';

// 使用 dashboard 命名空间的调试器
const { dashboard: debugDashboard } = debug;

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

interface APIResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface DashboardData extends ProxyInfo {}

async function getProxyInfo(): Promise<ProxyInfo> {
  try {
    debugDashboard.group('Get Proxy Info');
    debugDashboard.info('Fetching proxy info from /api/dashboard/statistics');
    
    const response = await api.get<any>('/api/dashboard/statistics');
    debugDashboard.info('Proxy info response received');
    debugDashboard.log('Response data:', response.data);
    
    // 如果响应直接就是数据本身，将其包装成预期的格式
    const data: Partial<ProxyInfo> = {
      month_consumption: response.data.month_consumption,
      last_month_consumption: response.data.last_month_consumption,
      // 设置其他字段的默认值
      balance: 0,
      total_recharge: 0,
      total_consumption: response.data.month_consumption || 0,
      month_recharge: 0,
      dynamic_resources: [],
      static_resources: []
    };

    debugDashboard.info('Data transformed to expected format');
    debugDashboard.log('Transformed data:', data);
    debugDashboard.groupEnd();
    return data as ProxyInfo;
  } catch (error) {
    debugDashboard.group('Get Proxy Info Error');
    debugDashboard.error('Failed to fetch proxy info');
    debugDashboard.logError(error);
    debugDashboard.groupEnd();
    throw error;
  }
}

async function getFlowUsageLog(): Promise<FlowUsageLog> {
  try {
    const response = await api.get<APIResponse<FlowUsageLog>>('/api/dashboard/statistics');
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

export const getDashboardData = async (signal?: AbortSignal): Promise<ProxyInfo> => {
  try {
    debugDashboard.group('Get Dashboard Data');
    debugDashboard.info('Starting dashboard data fetch');
    
    const proxyInfo = await getProxyInfo();
    debugDashboard.info('Successfully fetched dashboard data');
    debugDashboard.log('Dashboard data:', proxyInfo);
    
    debugDashboard.groupEnd();
    return proxyInfo;
  } catch (error) {
    debugDashboard.group('Get Dashboard Data Error');
    debugDashboard.error('Failed to fetch dashboard data');
    debugDashboard.logError(error);
    debugDashboard.groupEnd();
    
    message.error('获取仪表盘数据失败');
    throw error;
  }
};
