export interface StaticOrderFormData {
  productNo: string;
  region: string;
  country: string;
  city: string;
  staticType: string;
  quantity: number;
  duration: number;
  remark?: string;
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