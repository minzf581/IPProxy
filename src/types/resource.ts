export interface BaseResource {
  id: number;
  status: 'active' | 'disabled' | 'deleted';
  location: string;
  createdAt: string;
  updatedAt: string;
  lastCheckAt?: string;
  isAvailable: boolean;
  remark?: string;
}

export interface DynamicResource extends BaseResource {
  proxyCount: number;
  activeCount: number;
  successRate: number;
  averageResponseTime: number;
}

export interface StaticResource extends BaseResource {
  ipAddress: string;
  isp?: string;
  currentUser?: {
    id: number;
    account: string;
    orderId: number;
  };
  expiredAt?: string;
}

export interface ResourceStatistics {
  totalResources: number;
  activeResources: number;
  dynamicResources: {
    total: number;
    active: number;
    available: number;
    successRate: number;
  };
  staticResources: {
    total: number;
    active: number;
    available: number;
    inUse: number;
  };
}

export interface ResourceUsage {
  date: string;
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uniqueUsers: number;
}

export interface AddDynamicResourceForm {
  location: string;
  count: number;
  remark?: string;
}

export interface AddStaticResourceForm {
  ipAddress: string;
  location: string;
  isp?: string;
  remark?: string;
}
