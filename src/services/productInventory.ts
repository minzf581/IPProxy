import request from '@/utils/request';
import type { ProductPrice, ProductPriceParams } from '@/types/product';
import type { ApiResponse } from '@/types/api';
import axios from 'axios';

// 创建价格服务专用的 axios 实例
const priceApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加认证拦截器
priceApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getProductPrices(params: ProductPriceParams): Promise<ApiResponse<ProductPrice[]>> {
  try {
    console.log('发送请求参数:', params);
    const response = await priceApi.get<ApiResponse<ProductPrice[]>>('/product/prices', { params });
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
  const response = await priceApi.put<ApiResponse<ProductPrice>>(`/product/prices/${id}`, data);
  return response.data;
}

export async function createProductPrice(data: Omit<ProductPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ProductPrice>> {
  const response = await priceApi.post<ApiResponse<ProductPrice>>('/product/prices', data);
  return response.data;
}

export async function deleteProductPrice(id: number): Promise<ApiResponse<void>> {
  const response = await priceApi.delete<ApiResponse<void>>(`/product/prices/${id}`);
  return response.data;
}

export async function updateProductPrices(data: { 
  is_global: boolean;
  agent_id?: number;
  prices: Array<{ id: number; price: number; }>;
}): Promise<ApiResponse<void>> {
  const response = await priceApi.post<ApiResponse<void>>('/product/prices', data);
  return response.data;
}

export async function syncProductPrices(): Promise<ApiResponse<void>> {
  const response = await priceApi.post<ApiResponse<void>>('/product/prices/sync');
  return response.data;
} 