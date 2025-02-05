import { api } from '@/utils/request';
import type { DashboardData, DynamicResource, StaticResource } from '@/types/dashboard';
import type { ApiResponse } from '@/types/api';

// 使用预定义的 dashboard 命名空间
export const dashboard = {
  // 获取仪表盘数据
  async getData(agentId?: string): Promise<DashboardData> {
    try {
      const url = agentId ? `/open/app/dashboard/info/v2?agent_id=${agentId}` : '/open/app/dashboard/info/v2';
      const response = await api.get<ApiResponse<DashboardData>>(url);
      return {
        ...response.data.data,
        recentOrders: [],
        userGrowth: [],
        revenueStats: []
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  },

  // 获取动态资源列表
  async getDynamicResources(): Promise<DynamicResource[]> {
    try {
      const response = await api.get<ApiResponse<DynamicResource[]>>('/open/app/dashboard/dynamic-resources');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get dynamic resources:', error);
      throw error;
    }
  },

  // 获取静态资源列表
  async getStaticResources(): Promise<StaticResource[]> {
    try {
      const response = await api.get<ApiResponse<StaticResource[]>>('/open/app/dashboard/static-resources');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get static resources:', error);
      throw error;
    }
  }
};

export default dashboard;
