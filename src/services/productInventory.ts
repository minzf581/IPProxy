import request from '@/utils/request';
import type { ProductPrice, ProductPriceParams } from '@/types/product';
import type { ApiResponse } from '@/types/api';

interface GetPricesParams {
  is_global: boolean;
  agent_id?: number | null;
  proxy_types?: number[];
}

export async function getProductPrices(params: GetPricesParams): Promise<ApiResponse<ProductPrice[]>> {
  try {
    console.log('发送请求参数:', params);
    const queryParams = new URLSearchParams();
    
    // 如果有代理商ID，则设置is_global为false
    if (params.agent_id) {
      queryParams.append('is_global', 'false');
      queryParams.append('agent_id', String(params.agent_id));
    } else {
      queryParams.append('is_global', String(params.is_global));
    }
    
    // 添加代理类型数组
    const proxyTypes = params.proxy_types || [104, 105, 201];
    proxyTypes.forEach(type => {
      queryParams.append('proxy_types', String(type));
    });
    
    console.log('处理后的请求参数:', queryParams.toString());
    
    const response = await request.get('/api/product/prices', { 
      params: queryParams
    });
    
    console.log('API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取价格列表失败:', error);
    throw error;
  }
}

export async function createProductPrice(data: Omit<ProductPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ProductPrice>> {
  const response = await request.post<ApiResponse<ProductPrice>>('/api/settings/prices', data);
  return response.data;
}

export async function deleteProductPrice(id: number): Promise<ApiResponse<void>> {
  const response = await request.delete<ApiResponse<void>>(`/api/settings/prices/${id}`);
  return response.data;
}

export async function syncProductPrices(): Promise<ApiResponse<void>> {
  const response = await request.post<ApiResponse<void>>('/api/settings/prices/sync');
  return response.data;
}

export async function syncProductStock(): Promise<ApiResponse<void>> {
  try {
    console.log('开始同步库存');
    const response = await request.post<ApiResponse<void>>('/api/proxy/inventory/sync');
    console.log('同步库存响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('同步库存失败:', error);
    throw error;
  }
}

export interface PriceUpdateItem {
  product_id: number;
  type: string;
  proxy_type: number;
  price: number;
  min_agent_price: number;
  is_global: boolean;
  agent_id?: number;
}

interface BatchUpdateRequest {
  prices: PriceUpdateItem[];
  agent_id?: number;
}

export async function batchUpdateProductPriceSettings(data: BatchUpdateRequest): Promise<ApiResponse<void>> {
  try {
    console.log('批量更新价格数据(原始):', data);
    
    // 修改请求数据，确保当有agent_id时设置is_global为false
    const modifiedData = {
      ...data,
      prices: data.prices.map(item => ({
        ...item,
        is_global: !data.agent_id,
        agent_id: data.agent_id
      }))
    };
    
    console.log('批量更新价格数据(修改后):', modifiedData);
    const response = await request.post('/api/settings/prices/batch', modifiedData);
    return response.data;
  } catch (error) {
    console.error('批量更新价格失败:', error);
    throw error;
  }
} 