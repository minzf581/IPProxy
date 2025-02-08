import type { DynamicOrder, StaticOrder, OrderStatistics } from '@/types/order';
import { api } from '@/utils/request';
import type { ApiResponse } from '@/types/api';
import { API_ROUTES } from '@/shared/routes';

export async function getDynamicOrderList(params: {
  page: number;
  pageSize: number;
  userId?: number;
  agentId?: number;
  status?: string;
}): Promise<{ list: DynamicOrder[]; total: number; page: number; page_size: number }> {
  const response = await api.get<{ 
    code: number; 
    message: string; 
    data: { 
      list: DynamicOrder[]; 
      total: number;
      page: number;
      page_size: number;
    } 
  }>('/api/dynamic', { params });
  return response.data.data;
}

export async function getStaticOrderList(params: {
  page: number;
  pageSize: number;
  userId?: number;
  agentId?: number;
  status?: string;
}): Promise<{ list: StaticOrder[]; total: number }> {
  const response = await api.get<{ code: number; message: string; data: { list: StaticOrder[]; total: number } }>('/api/orders/static', { params });
  return response.data.data;
}

export async function createDynamicOrder(params: {
  userId: number;
  agentId?: number;
  resourceId: number;
  duration: number;
}): Promise<DynamicOrder> {
  const response = await api.post<{ code: number; message: string; data: DynamicOrder }>('/api/orders/dynamic', params);
  return response.data.data;
}

export async function createStaticOrder(params: {
  userId: number;
  agentId?: number;
  resourceId: number;
  quantity: number;
}): Promise<StaticOrder> {
  const response = await api.post<{ code: number; message: string; data: StaticOrder }>('/api/orders/static', params);
  return response.data.data;
}

export async function getDynamicOrderDetail(orderId: number): Promise<DynamicOrder> {
  const response = await api.get<{ code: number; message: string; data: DynamicOrder }>(`/api/orders/dynamic/${orderId}`);
  if (!response.data.data) {
    throw new Error('Dynamic order not found');
  }
  return response.data.data;
}

export async function getStaticOrderDetail(orderId: number): Promise<StaticOrder> {
  const response = await api.get<{ code: number; message: string; data: StaticOrder }>(`/api/orders/static/${orderId}`);
  if (!response.data.data) {
    throw new Error('Static order not found');
  }
  return response.data.data;
}

export async function updateOrder(orderId: number, params: Partial<DynamicOrder | StaticOrder>): Promise<void> {
  await api.put<{ code: number; message: string }>(`/api/orders/${orderId}`, params);
}

export async function getOrderStatistics(params: {
  userId?: number;
  agentId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<OrderStatistics> {
  const response = await api.get<{ code: number; message: string; data: OrderStatistics }>('/api/orders/statistics', { params });
  return response.data.data;
}

export async function renewDynamicOrder(orderId: number, duration: number): Promise<void> {
  await api.post<{ code: number; message: string }>(`/api/orders/dynamic/${orderId}/renew`, { duration });
}

export async function renewStaticOrder(orderId: number, duration: number): Promise<void> {
  await api.post<{ code: number; message: string }>(`/api/orders/static/${orderId}/renew`, { duration });
}

export async function cancelDynamicOrder(orderId: number): Promise<void> {
  await api.post<{ code: number; message: string }>(`/api/orders/dynamic/${orderId}/cancel`);
}

export async function cancelStaticOrder(orderId: number): Promise<void> {
  await api.post<{ code: number; message: string }>(`/api/orders/static/${orderId}/cancel`);
}

export async function createOrder(params: {
  orderType: 'dynamic_proxy' | 'static_proxy';
  poolId: string;
  trafficAmount?: number;
  unitPrice: number;
  totalAmount: number;
  remark?: string;
}): Promise<ApiResponse<any>> {
  try {
    console.log('[Order Service] Creating order with params:', params);
    
    const response = await api.post<ApiResponse<any>>(API_ROUTES.ORDER.CREATE, params);
    
    console.log('[Order Service] Create order response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Order Service] Error creating order:', error);
    throw error;
  }
}
