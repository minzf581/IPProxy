export interface BaseOrder {
  id: number;
  orderNo: string;
  userAccount: string;
  agentAccount: string;
  createdAt: string;
  status: 'active' | 'expired' | 'cancelled';
  amount: number;
  remark?: string;
}

export interface DynamicOrder extends BaseOrder {
  duration: number;
  quantity: number;
  expiredAt: string;
  region?: string;
  proxyList: Array<{
    id: string;
    ipAddress: string;
    port: number;
    username: string;
    password: string;
    location?: string;
    lastUsedAt?: string;
  }>;
}

export interface StaticOrder extends BaseOrder {
  duration: number;
  quantity: number;
  expiredAt: string;
  region?: string;
  proxyList: Array<{
    id: string;
    ipAddress: string;
    port: number;
    username: string;
    password: string;
    location?: string;
    lastUsedAt?: string;
  }>;
}

export interface OrderSearchParams {
  orderNo?: string;
  userAccount?: string;
  agentAccount?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderStatistics {
  totalOrders: number;
  activeOrders: number;
  expiredOrders: number;
  cancelledOrders: number;
  totalAmount: number;
  monthlyAmount: number;
}