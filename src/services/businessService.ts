import request from '@/utils/request';
import type { 
  DynamicBusinessOrder, 
  StaticBusinessOrder, 
  BusinessResponse 
} from '@/types/business';

export async function submitDynamicOrder(data: DynamicBusinessOrder): Promise<BusinessResponse> {
  return request(`/api/user/${data.userId}/activate-business`, {
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
  return request(`/api/user/${data.userId}/activate-business`, {
    method: 'POST',
    data: {
      proxyType: 101,  // 静态云平台代理，可以是101-103
      products: data.products
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