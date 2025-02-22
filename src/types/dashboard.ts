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

export interface DashboardStatistics {
  balance: number;
  totalRecharge: number;
  totalConsumption: number;
  monthRecharge: number;
  monthConsumption: number;
  lastMonthConsumption: number;
}

export interface DynamicResource {
  title: string;
  total: number;
  used: number;
  remaining: number;
  percentage: number;
  today_usage: number;
  month_usage: number;
  last_month_usage: number;
}

export interface StaticResource {
  title: string;
  total: number;
  used: number;
  available: number;
  percentage: number;
  month_opened: number;
  last_month_opened: number;
}

export interface DashboardData {
  statistics: DashboardStatistics;
  dynamicResources: DynamicResource[];
  staticResources: StaticResource[];
  dailyStats?: Array<{
    date: string;
    orders: number;
    amount: number;
    new_users: number;
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