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
    console.log('[Dashboard Service] Agent ID type:', typeof agentId);
    
    const url = '/open/app/dashboard/info/v2';
    const params = agentId ? { agent_id: agentId } : undefined;
      
    console.log('[Dashboard Service] Request URL:', url);
    console.log('[Dashboard Service] Request params:', params);
    
    const response = await api.get<ApiResponse<DashboardDataType>>(url, { params });
    console.log('[Dashboard Service] Dashboard data full response:', response);
    
    if (response.data.code !== 0) {
      throw new Error(response.data.msg || '获取仪表盘数据失败');
    }
    
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Dashboard Service] Error getting dashboard data:', axiosError);
    console.error('[Dashboard Service] Error details:', {
      message: axiosError.message,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      responseData: axiosError.response?.data
    });
    throw error;
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