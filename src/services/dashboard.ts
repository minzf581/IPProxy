import { api } from '@/utils/request';
import type { DynamicResource, StaticResource, DashboardData } from '@/types/dashboard';
import type { ApiResponse } from '@/types/api';

interface DashboardDataResponse {
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
}

interface DashboardDataExtended extends DashboardDataResponse {
  recentOrders: any[];
  userGrowth: any[];
  revenueStats: any[];
}

// 使用预定义的 dashboard 命名空间
export const dashboard = {
  // 获取仪表盘数据
  async getData(agentId?: string): Promise<DashboardData> {
    try {
      const url = agentId 
        ? `/api/dashboard/agent/${agentId}` 
        : '/api/open/app/dashboard/info/v2';
      const response = await api.get<ApiResponse<DashboardData>>(url);
      
      if (response.data.code !== 0) {
        throw new Error(response.data.message || '获取仪表盘数据失败');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  },

  // 获取动态资源列表
  async getDynamicResources(): Promise<DynamicResource[]> {
    try {
      const response = await api.get<ApiResponse<DynamicResource[]>>('/api/open/app/dashboard/dynamic-resources');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get dynamic resources:', error);
      throw error;
    }
  },

  // 获取静态资源列表
  async getStaticResources(): Promise<StaticResource[]> {
    try {
      const response = await api.get<ApiResponse<StaticResource[]>>('/api/open/app/dashboard/static-resources');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get static resources:', error);
      throw error;
    }
  }
};

// 获取仪表盘数据
export async function getDashboardData(agentId?: string): Promise<ApiResponse<DashboardData>> {
  try {
    console.log('获取仪表盘数据, agentId:', agentId);
    const url = agentId 
      ? `/api/dashboard/agent/${agentId}`
      : '/api/open/app/dashboard/info/v2';
    console.log('请求URL:', url);
    const response = await api.get<ApiResponse<DashboardData>>(url);
    console.log('仪表盘响应数据:', response.data);
    
    if (response.data.code !== 0) {
      throw new Error(response.data.message || '获取仪表盘数据失败');
    }
    
    return response.data;
  } catch (error: unknown) {
    console.error('获取仪表盘数据失败:', error);
    if (error instanceof Error) {
      throw new Error(error.message || '获取仪表盘数据失败');
    }
    throw new Error('获取仪表盘数据失败');
  }
}

export default dashboard;
