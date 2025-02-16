import request from '@/utils/request';
import type { 
  DynamicBusinessOrder, 
  StaticBusinessOrder, 
  BusinessResponse 
} from '@/types/business';

export async function submitDynamicOrder(data: DynamicBusinessOrder): Promise<BusinessResponse> {
  return request('/api/business/dynamic', {
    method: 'POST',
    data,
  });
}

export async function submitStaticOrder(data: StaticBusinessOrder): Promise<BusinessResponse> {
  return request('/api/business/static', {
    method: 'POST',
    data,
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