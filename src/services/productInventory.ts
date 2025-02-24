import request from '@/utils/request';
import type { ProductPrice, ProductPriceParams } from '@/types/product';
import type { ApiResponse } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user';
import type { ProductStock } from '@/types/product';

interface GetPricesParams {
  is_global: boolean;
  agent_id?: number | null;
  user_id?: number | null;
  proxy_types?: number[];
  app_username?: string;
}

export async function getProductPrices(params: GetPricesParams): Promise<ApiResponse<ProductPrice[]>> {
  try {
    console.log('发送请求参数:', params);
    const queryParams = new URLSearchParams();
    
    // 获取当前用户角色
    const token = localStorage.getItem('token');
    const userRole = token ? JSON.parse(atob(token.split('.')[1])).role : null;
    const isAgent = userRole === UserRole.AGENT;
    
    // 如果是代理商，使用代理商ID
    if (isAgent) {
      queryParams.append('is_global', 'false');
      // 不需要传agent_id，后端会自动使用当前登录的代理商ID
    } else {
      // 如果指定了用户ID和用户名，则获取该用户的价格
      if (params.user_id && params.app_username) {
        queryParams.append('user_id', String(params.user_id));
        queryParams.append('app_username', params.app_username);
        queryParams.append('is_global', 'false');
      } 
      // 如果指定了代理商ID，则获取该代理商的价格
      else if (params.agent_id) {
        queryParams.append('agent_id', String(params.agent_id));
        queryParams.append('is_global', 'false');
      }
      // 否则获取全局价格
      else {
        queryParams.append('is_global', 'true');
      }
    }
    
    // 添加代理类型数组
    const proxyTypes = params.proxy_types || [104];
    proxyTypes.forEach(type => {
      queryParams.append('proxy_types', String(type));
    });
    
    console.log('处理后的请求参数:', queryParams.toString());
    
    const response = await request.get('/api/product/prices', { 
      params: queryParams
    });
    
    // 如果是代理商，移除最低代理价格字段
    if (isAgent && response.data?.data) {
      response.data.data = response.data.data.map(({ minAgentPrice, ...rest }) => rest);
    }
    
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
    const response = await request.post<ApiResponse<void>>('/api/business/dynamic-proxy/sync-inventory');
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
  ip_whitelist?: string[];
  app_username?: string;
}

export async function batchUpdateProductPriceSettings(data: {
  prices: PriceUpdateItem[];
  agent_id?: number;
  app_username?: string;
  user_id?: number;
}): Promise<ApiResponse<void>> {
  try {
    console.log('批量更新价格和IP白名单数据(原始):', JSON.stringify(data, null, 2));
    
    if (!data.app_username) {
      throw new Error('缺少必要的用户名参数');
    }
    
    // 确保所有必要字段都存在
    const modifiedData = {
      prices: data.prices.map(item => ({
        product_id: item.product_id,
        price: Number(item.price),
        min_agent_price: Number(item.min_agent_price || 0),
        type: item.type,
        proxy_type: Number(item.proxy_type),
        ip_whitelist: item.ip_whitelist || [],
        app_username: data.app_username,  // 使用传入的用户名
        user_id: data.user_id
      })),
      is_global: false,  // 默认为非全局更新
      agent_id: data.agent_id ? Number(data.agent_id) : undefined,
      app_username: data.app_username,
      user_id: data.user_id
    };
    
    console.log('发送到后端的数据:', JSON.stringify(modifiedData, null, 2));
    const response = await request.post<ApiResponse<void>>('/api/settings/prices/batch', modifiedData);
    console.log('后端响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('批量更新价格和IP白名单失败:', error);
    throw error;
  }
}

// 获取产品库存
export async function getProductStock(): Promise<ApiResponse<ProductStock[]>> {
  try {
    const response = await request.get<ApiResponse<ProductStock[]>>('/api/business/dynamic-proxy/inventory');
    return response.data;
  } catch (error) {
    console.error('获取产品库存失败:', error);
    throw error;
  }
}

import { api } from '@/utils/request';

export interface ProductInventory {
  id: number;
  productNo: string;
  name: string;
  type: string;
  minAgentPrice: number;
  price: number;
  stock: number;
  status: string;
}

export interface CreateProductParams {
  productNo: string;
  name: string;
  type: string;
  minAgentPrice: number;
  price: number;
  stock: number;
}

export interface UpdateProductParams {
  id: number;
  minAgentPrice?: number;
  price?: number;
  stock?: number;
  status?: string;
}

export async function getProductList(): Promise<ApiResponse<ProductInventory[]>> {
  return api.get('/api/products');
}

export async function createProduct(params: CreateProductParams): Promise<ApiResponse<ProductInventory>> {
  return api.post('/api/products', params);
}

export async function updateProduct(params: UpdateProductParams): Promise<ApiResponse<ProductInventory>> {
  return api.put(`/api/products/${params.id}`, params);
}