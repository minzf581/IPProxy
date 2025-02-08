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
  statistics: Statistics;
  dynamicResources: DynamicResource[];
  staticResources: StaticResource[];
  recentOrders?: Array<{
    id: number;
    userId: number;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  userGrowth?: Array<{
    date: string;
    count: number;
  }>;
  revenueStats?: Array<{
    date: string;
    amount: number;
  }>;
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