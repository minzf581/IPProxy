import { api } from '@/utils/request';
import { message } from 'antd';
import type { ApiResponse } from '@/types/api';

// Debug 工具
const debug = {
  log: (...args: any[]) => {
    console.log('[Settings Service]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[Settings Service]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[Settings Service]', ...args);
  }
};

// 价格配置类型定义
export interface PriceSettings {
  dynamic: {
    [key: string]: number;
    pool1: number;
    pool2: number;
  };
  static: {
    [key: string]: number;
    residential: number;
    datacenter: number;
  };
}

// 默认价格配置
export const DEFAULT_PRICES: PriceSettings = {
  dynamic: {
    pool1: 100,
    pool2: 200
  },
  static: {
    residential: 300,
    datacenter: 400
  }
};

// 获取资源价格设置
export async function getResourcePrices(agentId: number): Promise<PriceSettings> {
  try {
    debug.log(`开始获取代理商 ${agentId} 的价格设置`);
    const response = await api.get<ApiResponse<PriceSettings>>(`/settings/agent/${agentId}/prices`);
    
    if (!response.data || response.data.code !== 0) {
      throw new Error(response.data?.msg || '获取价格设置失败');
    }
    
    debug.log('成功获取价格设置:', response.data.data);
    return response.data.data;
  } catch (error: any) {
    debug.error('获取价格设置失败:', error);
    
    if (error.response?.status === 403) {
      debug.warn('没有权限查看价格设置，使用默认价格');
      return DEFAULT_PRICES;
    }
    
    throw error;
  }
}

// 更新资源价格设置
export async function updateResourcePrices(agentId: number, prices: PriceSettings): Promise<void> {
  try {
    debug.log(`开始更新代理商 ${agentId} 的价格设置:`, prices);
    const response = await api.put<ApiResponse<void>>(`/settings/agent/${agentId}/prices`, prices);
    
    if (!response.data || response.data.code !== 0) {
      throw new Error(response.data?.msg || '更新价格设置失败');
    }
    
    debug.log('成功更新价格设置');
  } catch (error: any) {
    debug.error('更新价格设置失败:', error);
    throw error;
  }
} 