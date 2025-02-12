import { api } from '@/utils/request';
import type { User, UserProfile } from '@/types/user';
import type { DynamicOrder, StaticOrder, OrderSearchParams } from '@/types/order';
import type { StatisticsData } from '@/types/statistics';
import type { PaginatedData, PaginationParams, ProductPriceParams } from '@/types/api';

// 用户相关
export const getUserProfile = () => api.get<UserProfile>('/user/profile');

// 订单相关
export const getDynamicOrders = (params: OrderSearchParams & PaginationParams) => 
  api.get<PaginatedData<DynamicOrder>>('/orders/dynamic', { params });

export const getStaticOrders = (params: OrderSearchParams & PaginationParams) => 
  api.get<PaginatedData<StaticOrder>>('/orders/static', { params });

export const getDynamicOrderDetail = (id: string) => 
  api.get<DynamicOrder>(`/orders/dynamic/${id}`);

export const getStaticOrderDetail = (id: string) => 
  api.get<StaticOrder>(`/orders/static/${id}`);

// 统计相关
export const getStatistics = () => api.get<StatisticsData>('/statistics');

// 价格相关
export async function getPrices(params: ProductPriceParams) {
  return api.get('/v1/product/prices', { params });
}

export async function syncPrices() {
  return api.post('/v1/product/prices/sync');
}
