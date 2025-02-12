import request from '@/utils/request';
import type { ProductPrice, ProductPriceParams } from '@/types/product';

export async function getProductPrices(params: ProductPriceParams) {
  const apiParams = {
    is_global: params.isGlobal,
    agent_id: params.agentId
  };
  const response = await request.get<ProductPrice[]>('/api/product/prices', { params: apiParams });
  return response.data;
}

export async function updateProductPrice(id: number, data: Partial<ProductPrice>) {
  const response = await request.put<ProductPrice>(`/api/product/prices/${id}`, data);
  return response.data;
}

export async function createProductPrice(data: Omit<ProductPrice, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await request.post<ProductPrice>('/api/product/prices', data);
  return response.data;
}

export async function deleteProductPrice(id: number) {
  const response = await request.delete<void>(`/api/product/prices/${id}`);
  return response.data;
}

export async function updateProductPrices(data: { 
  is_global: boolean;
  agent_id?: number;
  prices: Array<{ id: number; price: number; }>;
}) {
  const response = await request.post('/api/product/prices', data);
  return response.data;
} 