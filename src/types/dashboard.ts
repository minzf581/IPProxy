export interface StatCardData {
  title: string;
  amount: number;
  icon?: React.ReactNode;
}

export interface ResourceUsageData {
  title: string;
  percentage: number;
  total: string;
  current: string;
  lastMonth: string;
  today: string;
}

export interface StaticResourceData {
  title: string;
  percentage: number;
  total: number;
  currentMonth: number;
  lastMonth: number;
  available: number;
  expired: number;
}

export interface DynamicResource {
  id: string;
  name: string;
  usageRate: number;
  total: number;
  monthly: number;
  today: number;
  lastMonth: number;
}

export interface StaticResource {
  id: string;
  name: string;
  usageRate: number;
  total: number;
  monthly: number;
  lastMonth: number;
  available: number;
  expired: number;
}

export interface Statistics {
  totalRecharge: number;
  totalConsumption: number;
  balance: number;
  monthRecharge: number;
  monthConsumption: number;
  lastMonthConsumption: number;
}

export interface DashboardData {
  agent: {
    id: string;
    username: string;
    balance: number;
  };
  statistics: {
    total_recharge: number;
    monthly_recharge: number;
    total_consumption: number;
    monthly_consumption: number;
    total_users: number;
    active_users: number;
    total_orders: number;
    monthly_orders: number;
  };
  dynamicResources: DynamicResource[];
  staticResources: StaticResource[];
}

export interface AgentListResponse {
  list: Array<{
    id: number;
    username: string;
    email: string;
    balance: number;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
} 