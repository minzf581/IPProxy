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
  usage_rate: number;
  total: number;
  monthly: number;
  today: number;
  last_month: number;
}

export interface StaticResource {
  id: string;
  name: string;
  usage_rate: number;
  total: number;
  monthly: number;
  last_month: number;
  available: number;
  expired: number;
}

export interface Statistics {
  total_recharge: number;
  total_consumption: number;
  balance: number;
  monthly_recharge: number;
  monthly_consumption: number;
  last_month_consumption: number;
}

export interface DashboardData {
  statistics: Statistics;
  dynamic_resources: DynamicResource[];
  static_resources: StaticResource[];
  recentOrders: Array<{
    id: number;
    userId: number;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  revenueStats: Array<{
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