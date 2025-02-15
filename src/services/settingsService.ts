import { api } from '@/utils/request';
import type { ApiResponse } from '@/types/api';
import type { ProductPriceSettings } from '@/types/product';

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

// 获取资源价格设置
export async function getResourcePrices(): Promise<PriceSettings> {
  try {
    debug.log('获取资源价格设置');
    const response = await api.get<ApiResponse<PriceSettings>>('/api/settings/prices');
    
    if (!response.data || response.data.code !== 0) {
      throw new Error(response.data?.msg || '获取价格设置失败');
    }
    
    debug.log('成功获取价格设置:', response.data.data);
    return response.data.data;
  } catch (error: any) {
    debug.error('获取价格设置失败:', error);
    throw error;
  }
}

// 更新资源价格设置
export async function updateResourcePrices(agentId: number, prices: PriceSettings): Promise<void> {
  try {
    debug.log(`开始更新代理商 ${agentId} 的价格设置:`, prices);
    const response = await api.put<ApiResponse<void>>(`/api/settings/agent/${agentId}/prices`, prices);
    
    if (!response.data || response.data.code !== 0) {
      throw new Error(response.data?.msg || '更新价格设置失败');
    }
    
    debug.log('成功更新价格设置');
  } catch (error: any) {
    debug.error('更新价格设置失败:', error);
    throw error;
  }
}

// 获取产品价格设置
export async function getProductPriceSettings(productId: string): Promise<ApiResponse<ProductPriceSettings>> {
  try {
    debug.log('获取产品价格设置, productId:', productId);
    const response = await api.get<ApiResponse<ProductPriceSettings>>(`/api/settings/prices/${productId}`);
    return response.data;
  } catch (error: any) {
    debug.error('获取价格设置失败:', error);
    throw new Error(error.response?.data?.msg || '获取价格设置失败');
  }
}

// 更新产品价格设置
export async function updateProductPriceSettings(
  productId: string,
  data: Partial<ProductPriceSettings>
): Promise<ApiResponse<void>> {
  try {
    debug.log('更新产品价格设置:', { productId, data });
    const response = await api.put<ApiResponse<void>>(`/api/settings/prices/${productId}`, {
      ...data,
      productId
    });
    return response.data;
  } catch (error: any) {
    debug.error('更新价格设置失败:', error);
    throw new Error(error.response?.data?.msg || '更新价格设置失败');
  }
}

// 批量更新产品价格设置
export async function batchUpdateProductPriceSettings(
  updates: Array<{
    productId: string;
    type: string;
    proxyType: number;
    globalPrice: number;
    minAgentPrice: number;
    isGlobal: boolean;
  }>
): Promise<ApiResponse<void>> {
  try {
    debug.log('开始批量更新产品价格设置');
    
    if (!updates || updates.length === 0) {
      throw new Error('没有需要更新的数据');
    }

    // 转换数据格式以匹配后端期望
    const requestData = {
      prices: updates.map(update => ({
        product_id: update.productId,
        type: update.type,
        proxy_type: update.proxyType,
        price: update.globalPrice,
        min_agent_price: update.minAgentPrice,
        is_global: update.isGlobal
      }))
    };

    debug.log('发送价格更新请求:', {
      url: '/api/settings/prices/batch',
      method: 'POST',
      data: JSON.stringify(requestData, null, 2)
    });

    const response = await api.post<ApiResponse<void>>('/api/settings/prices/batch', requestData);

    debug.log('价格更新响应:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    if (response.data.code !== 0 && response.data.code !== 200) {
      debug.error('价格更新失败:', response.data.message);
      throw new Error(response.data.message || '价格更新失败');
    }

    return response.data;
  } catch (error: any) {
    debug.error('价格更新异常:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    throw new Error(error.response?.data?.message || error.message || '价格更新失败');
  }
} 