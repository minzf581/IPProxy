export interface StaticOrderFormData {
  orderType: 'static_proxy';
  poolId: string;
  regionCode?: string;
  countryCode?: string;
  cityCode?: string;
  staticType?: string;
  ipCount: number;
  duration: number;
  unitPrice: number;
  totalAmount: number;
  remark?: string;
  userId: number;
}

export interface StaticOrderInstance {
  instanceNo: string;
  proxyIp: string;
  proxyPort: number;
  username: string;
  password: string;
  expireTime: string;
  status: number;
}

export interface StaticOrder {
  orderNo: string;
  appOrderNo: string;
  userId: number;
  agentId: number;
  productNo: string;
  proxyType: number;
  regionCode: string;
  countryCode: string;
  cityCode: string;
  staticType: string;
  ipCount: number;
  duration: number;
  unit: number;
  amount: number;
  status: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  instances: StaticOrderInstance[];
}

export interface StaticOrderResponse {
  code: number;
  msg: string;
  data: StaticOrder;
} 