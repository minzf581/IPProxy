import type { ProductPrice } from './product';

export interface BusinessOrder {
  userId: number;
  productType: string;
  proxyType: number;
  duration?: number; // 静态代理时长
  quantity: number; // 动态代理流量/静态代理数量
  unitPrice: number;
  totalPrice: number;
  remark?: string;
}

export interface DynamicBusinessOrder {
  userId: number;
  flow: number;
  remark?: string;
}

export interface StaticBusinessOrderProduct {
  productId: string;
  quantity: number;
  duration: number;
  remark?: string;
}

export interface StaticBusinessOrder {
  userId: number;
  products: StaticBusinessOrderProduct[];
}

export interface BusinessFormState {
  selectedUserId?: number;
  selectedProducts: string[];
  quantities: Record<string, number>;
  durations: Record<string, number>;
  remarks: Record<string, string>;
}

export interface BusinessResponse {
  code: number;
  message: string;
  data?: any;
} 