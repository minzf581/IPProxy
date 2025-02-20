import request from '@/utils/request';
import type { 
  DynamicBusinessOrder, 
  StaticBusinessOrder, 
  BusinessResponse 
} from '@/types/business';
import type { ExtractConfig } from '@/types/dynamicProxy';
import { API_PREFIX } from '@/shared/routes';

export async function submitDynamicOrder(data: DynamicBusinessOrder): Promise<BusinessResponse> {
  return request(`${API_PREFIX.USER}/${data.userId}/activate-business`, {
    method: 'POST',
    data: {
      userId: String(data.userId),
      username: data.username,
      agentId: String(data.agentId),
      agentUsername: data.agentUsername,
      proxyType: 'dynamic',
      poolType: 'pool1',
      traffic: String(data.flow),
      duration: String(data.duration),
      remark: data.remark,
      total_cost: data.totalCost
    },
  });
}

export async function submitStaticOrder(data: StaticBusinessOrder): Promise<BusinessResponse> {
  return request(`${API_PREFIX.USER}/${data.userId}/activate-business`, {
    method: 'POST',
    data: {
      userId: String(data.userId),
      proxyType: 'static',
      products: data.products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        duration: product.duration,
        remark: product.remark
      }))
    },
  });
}

export async function getUserBalance(): Promise<BusinessResponse> {
  return request('/api/business/balance', {
    method: 'GET',
  });
}

export async function getBusinessProducts(params: {
  type: 'static' | 'dynamic';
  userId?: number;
}): Promise<BusinessResponse> {
  return request('/api/business/products', {
    method: 'GET',
    params,
  });
}

export async function saveDynamicProxyAreas(data: {
  areas: Array<{
    areaCode: string;
    areaName: string;
    countries: Array<{
      countryCode: string;
      countryName: string;
      cities: Array<{
        cityCode: string;
        cityName: string;
      }>;
    }>;
  }>;
}): Promise<BusinessResponse> {
  return request('/api/business/dynamic-proxy/areas', {
    method: 'POST',
    data,
  });
}

export async function getDynamicProxyProducts(): Promise<BusinessResponse> {
  try {
    const response = await request<BusinessResponse>('/api/business/dynamic-proxy/products', {
      method: 'GET'
    });
    
    // 记录响应数据，方便调试
    console.log('[API Response] getDynamicProxyProducts:', {
      status: response.status,
      data: response.data
    });
    
    // 确保返回正确的数据结构
    return {
      code: response.data?.code || 0,
      msg: response.data?.msg || 'success',
      data: response.data?.data || []
    };
  } catch (error) {
    console.error('[API Error] getDynamicProxyProducts:', error);
    throw error;
  }
}

export async function createProxyUser(data: {
  appUsername: string;
  limitFlow: number;
  remark: string;
}): Promise<BusinessResponse> {
  try {
    const response = await request<BusinessResponse>('/api/business/dynamic-proxy/create-user', {
      method: 'POST',
      data
    });
    
    // 记录响应数据，方便调试
    console.log('[API Response]', {
      url: '/api/business/dynamic-proxy/create-user',
      method: 'post',
      status: response.status,
      data: response
    });
    
    return response.data;
  } catch (error) {
    console.error('[API Error]', error);
    throw error;
  }
}

export async function extractDynamicProxy(data: {
  addressCode: string;
  maxFlowLimit?: number;
  extractConfig: ExtractConfig;
}): Promise<BusinessResponse> {
  return request(`${API_PREFIX.BUSINESS}/dynamic-proxy/extract`, {
    method: 'POST',
    data
  });
}