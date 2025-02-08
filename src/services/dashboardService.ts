import { api } from '@/utils/request';
import type { ApiResponse } from '@/types/api';
import type { DashboardData as DashboardDataType, AgentListResponse } from '@/types/dashboard';
import type { AxiosError } from 'axios';

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
  statistics: Statistics;
  dynamicResources: DynamicResource[];
  staticResources: StaticResource[];
}

// 获取仪表盘数据
export async function getDashboardData(agentId?: string | number): Promise<DashboardDataType> {
  try {
    console.log('[Dashboard Service] Getting dashboard data for agent:', agentId);
    
    const url = '/open/app/dashboard/info/v2';
    const params = agentId ? { agent_id: agentId } : undefined;
      
    console.log('[Dashboard Service] Request URL:', url);
    console.log('[Dashboard Service] Request params:', params);
    
    const response = await api.get<ApiResponse<DashboardDataType>>(url, { params });
    const { data } = response.data;
    console.log('[Dashboard Service] Dashboard data:', JSON.stringify(data, null, 2));

    // 如果数据为空，返回默认值
    if (!data) {
      console.warn('[Dashboard Service] No data received, returning default values');
      return {
        statistics: {
          totalRecharge: 0,
          totalConsumption: 0,
          balance: 0,
          monthRecharge: 0,
          monthConsumption: 0,
          lastMonthConsumption: 0
        },
        dynamicResources: [],
        staticResources: []
      };
    }

    // 确保统计数据存在
    if (!data.statistics) {
      console.warn('[Dashboard Service] No statistics data, using default values');
      data.statistics = {
        totalRecharge: 0,
        totalConsumption: 0,
        balance: 0,
        monthRecharge: 0,
        monthConsumption: 0,
        lastMonthConsumption: 0
      };
    }

    // 固定的动态资源列表
    const defaultDynamicResources = [
      {
        id: 'pool1',
        name: '动态IP池1',
        usageRate: 0,
        total: 0,
        monthly: 0,
        today: 0,
        lastMonth: 0
      },
      {
        id: 'pool2',
        name: '动态IP池2',
        usageRate: 0,
        total: 0,
        monthly: 0,
        today: 0,
        lastMonth: 0
      },
      {
        id: 'pool3',
        name: '动态IP池3',
        usageRate: 0,
        total: 0,
        monthly: 0,
        today: 0,
        lastMonth: 0
      }
    ];

    // 固定的静态资源列表
    const defaultStaticResources = [
      {
        id: 'static1',
        name: '纯净静态1',
        usageRate: 0,
        total: 0,
        monthly: 0,
        lastMonth: 0,
        available: 0,
        expired: 0
      },
      {
        id: 'static2',
        name: '纯净静态2',
        usageRate: 0,
        total: 0,
        monthly: 0,
        lastMonth: 0,
        available: 0,
        expired: 0
      },
      {
        id: 'static3',
        name: '纯净静态3',
        usageRate: 0,
        total: 0,
        monthly: 0,
        lastMonth: 0,
        available: 0,
        expired: 0
      },
      {
        id: 'static4',
        name: '纯净静态4',
        usageRate: 0,
        total: 0,
        monthly: 0,
        lastMonth: 0,
        available: 0,
        expired: 0
      },
      {
        id: 'static5',
        name: '纯净静态5',
        usageRate: 0,
        total: 0,
        monthly: 0,
        lastMonth: 0,
        available: 0,
        expired: 0
      },
      {
        id: 'static7',
        name: '纯净静态7',
        usageRate: 0,
        total: 0,
        monthly: 0,
        lastMonth: 0,
        available: 0,
        expired: 0
      }
    ];

    // 将后端返回的数据与默认数据合并
    const mergedDynamicResources = defaultDynamicResources.map(defaultResource => {
      const backendResource = (data.dynamicResources || []).find(r => r.id === defaultResource.id);
      return backendResource ? {
        ...defaultResource,
        ...backendResource,
        name: defaultResource.name // 保持固定的名称
      } : defaultResource;
    });

    const mergedStaticResources = defaultStaticResources.map(defaultResource => {
      const backendResource = (data.staticResources || []).find(r => r.id === defaultResource.id);
      return backendResource ? {
        ...defaultResource,
        ...backendResource,
        name: defaultResource.name // 保持固定的名称
      } : defaultResource;
    });

    // 更新数据
    data.dynamicResources = mergedDynamicResources;
    data.staticResources = mergedStaticResources;

    console.log('[Dashboard Service] Final processed data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('[Dashboard Service] Error getting dashboard data:', error);
    if (error instanceof Error) {
      throw new Error(error.message || '获取仪表盘数据失败');
    } else {
      throw new Error('获取仪表盘数据失败');
    }
  }
}

// 获取代理列表
export async function getAgentList(params: { page: number; pageSize: number }): Promise<AgentListResponse> {
  try {
    console.log('[Dashboard Service] Getting agent list with params:', params);
    const response = await api.get<ApiResponse<AgentListResponse>>('/open/app/agent/list', { params });
    console.log('[Dashboard Service] Agent list response:', response);
    return response.data.data;
  } catch (error) {
    console.error('[Dashboard Service] Error getting agent list:', error);
    throw error;
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