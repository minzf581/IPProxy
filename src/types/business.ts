import type { AgentUser as AgentUserType, AgentInfo as AgentInfoType } from './agent';

export type AgentUser = AgentUserType;
export type AgentInfo = AgentInfoType;

export interface ProductPrice {
  id: string;
  type: string;
  proxyType: number;
  area: string;
  country?: string;
  city?: string;
  price: number;
  status: number;
  areaName: string;
  countryName?: string;
  cityName?: string;
  ipRange?: string;
  isGlobal?: boolean;
  stock?: number;
  minAgentPrice?: number;
  globalPrice?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface AgentListResponse {
  list: AgentInfo[];
  total: number;
  message?: string;
}

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
  username: string;
  agentId: number;
  agentUsername: string;
  flow: number;
  duration: number;
  remark?: string;
  totalCost: number;
}

export interface StaticBusinessOrderProduct {
  productId: string;
  quantity: number;
  duration: number;
  remark?: string;
}

export interface StaticBusinessOrder {
  userId: number;
  products: Array<{
    productId: string;
    quantity: number;
    duration: number;
    remark?: string;
  }>;
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
  msg: string;
  data?: any;
} 