import request from '@/utils/request';
import type { ProductPrice, ProductPriceParams } from '@/types/product';
import type { ApiResponse } from '@/types/api';

export async function getProductPrices(params: ProductPriceParams): Promise<ApiResponse<ProductPrice[]>> {
  const apiParams = {
    is_global: params.isGlobal,
    agent_id: params.agentId,
    type: params.type,
    area: params.area,
    country: params.country,
    city: params.city
  };
  
  try {
    console.log('发送请求参数:', apiParams);
    const response = await request.get<ApiResponse<ProductPrice[]>>('/product/prices', { params: apiParams });
    console.log('原始API响应:', JSON.stringify(response.data, null, 2));
    
    // 确保响应数据符合预期格式
    if (!response.data) {
      console.error('API响应格式错误:', response);
      throw new Error('API响应格式错误');
    }
    
    // 直接返回响应数据
    return response.data;
    
  } catch (error: any) {
    console.error('获取价格数据失败:', error);
    throw error;
  }
}

export async function updateProductPrice(id: number, data: Partial<ProductPrice>): Promise<ApiResponse<ProductPrice>> {
  const response = await request.put<ApiResponse<ProductPrice>>(`/product/prices/${id}`, data);
  return response.data;
}

export async function createProductPrice(data: Omit<ProductPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ProductPrice>> {
  const response = await request.post<ApiResponse<ProductPrice>>('/product/prices', data);
  return response.data;
}

export async function deleteProductPrice(id: number): Promise<ApiResponse<void>> {
  const response = await request.delete<ApiResponse<void>>(`/product/prices/${id}`);
  return response.data;
}

export async function updateProductPrices(data: { 
  is_global: boolean;
  agent_id?: number;
  prices: Array<{ id: number; price: number; }>;
}): Promise<ApiResponse<void>> {
  const response = await request.post<ApiResponse<void>>('/product/prices', data);
  return response.data;
}

export async function syncProductPrices(): Promise<ApiResponse<void>> {
  const response = await request.post<ApiResponse<void>>('/product/prices/sync');
  return response.data;
} 