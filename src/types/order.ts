export interface BaseOrder {
  id: string;
  orderNo: string;
  userAccount: string;
  agentAccount: string;
  createdAt: string;
  status: 'active' | 'expired';
  remark?: string;
}

export interface DynamicOrder extends BaseOrder {
  duration: number;
}

export interface StaticOrder extends BaseOrder {
  ipInfo: {
    subnet: string;
    port: number;
    country: string;
    city: string;
    resourceType: string;
  };
  expiredAt: string;
}

export interface OrderSearchParams {
  orderNo?: string;
  userAccount?: string;
  agentAccount?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}