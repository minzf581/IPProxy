import { api as request } from '@/utils/request';
import { API_ROUTES } from '@/shared/routes';
import type {
  StaticOrderFormData,
  StaticOrder,
  StaticOrderResponse
} from '@/types/staticOrder';

export async function createStaticOrder(data: StaticOrderFormData) {
  return request.post<StaticOrderResponse>(API_ROUTES.ORDER.STATIC.CREATE, data);
}

export async function getStaticOrder(orderNo: string) {
  return request.get<StaticOrderResponse>(`${API_ROUTES.ORDER.STATIC.DETAIL}/${orderNo}`);
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
  }>(API_ROUTES.ORDER.STATIC.LIST, {
    params,
  });
}

export async function updateStaticOrderStatus(
  orderNo: string,
  status: string,
  remark?: string
) {
  return request.put<StaticOrderResponse>(`${API_ROUTES.ORDER.STATIC.STATUS}/${orderNo}`, {
    status,
    remark,
  });
} 