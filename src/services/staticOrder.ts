import { api as request } from '@/utils/request';
import { API_ROUTES } from '@/shared/routes';
import type {
  StaticOrderFormData,
  StaticOrder,
  StaticOrderResponse
} from '@/types/staticOrder';

export async function createStaticOrder(data: StaticOrderFormData) {
  return request.post<StaticOrderResponse>('/api/open/app/static/order/create/v2', data);
}

export async function getStaticOrder(orderNo: string) {
  return request.get<StaticOrderResponse>(`/api/open/app/static/order/detail/v2/${orderNo}`);
}

export async function getStaticOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  startTime?: string;
  endTime?: string;
}) {
  return request.get<{
    code: number;
    msg: string;
    data: {
      total: number;
      list: StaticOrder[];
    };
  }>('/api/open/app/static/order/list/v2', {
    params,
  });
}

export async function updateStaticOrderStatus(
  orderNo: string,
  status: string,
  remark?: string
) {
  return request.put<StaticOrderResponse>(`/api/open/app/static/order/status/v2/${orderNo}`, {
    status,
    remark,
  });
} 