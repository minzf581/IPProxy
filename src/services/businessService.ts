import request from '@/utils/request';
import type { 
  DynamicBusinessOrder, 
  StaticBusinessOrder, 
  BusinessResponse 
} from '@/types/business';
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