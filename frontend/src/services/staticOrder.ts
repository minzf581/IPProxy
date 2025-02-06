import { request } from '@/utils/request';
import type {
  StaticOrderFormData,
  StaticOrder,
  StaticOrderResponse
} from '@/types/staticOrder';

export async function createStaticOrder(data: StaticOrderFormData) {
  return request<StaticOrderResponse>('/api/v1/static-orders', {
    method: 'POST',
    data,
  });
}

export async function getStaticOrder(orderNo: string) {
  return request<StaticOrderResponse>(`/api/v1/static-orders/${orderNo}`);
}

export async function getStaticOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  startTime?: string;
  endTime?: string;
}) {
  return request<{
    code: number;
    msg: string;
    data: {
      total: number;
      list: StaticOrder[];
    };
  }>('/api/v1/static-orders', {
    method: 'GET',
    params,
  });
}

export async function updateStaticOrderStatus(
  orderNo: string,
  status: string,
  remark?: string
) {
  return request<StaticOrderResponse>(`/api/v1/static-orders/${orderNo}/status`, {
    method: 'PUT',
    data: {
      status,
      remark,
    },
  });
} 