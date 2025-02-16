export interface AgentInfo {
  id: string;
  username: string;
  app_username?: string;
  platform_account?: string;
  email?: string;
  phone?: string | null;
  balance: number;
  status: string;  // 'active' | 'disabled'
  remark?: string | null;
  created_at: string;
  updated_at: string;
  total_income: number;
  total_expense: number;
  total_profit: number;
  total_orders: number;
  total_users: number;
}

export interface AgentStatistics {
  totalUsers: number;
  activeUsers: number;
  monthlyNewUsers: number;
  lastMonthNewUsers: number;
  totalOrders: number;
  activeOrders: number;
  totalIncome: number;
  monthlyIncome: number;
}

export interface CreateAgentForm {
  username: string;
  password: string;
  email?: string;
  balance?: number;
  phone?: string;
  remark?: string;
  status?: 'active' | 'disabled';
}

export interface UpdatePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateBalanceForm {
  amount: number;
  remark: string;
}

export interface UpdateAgentForm {
  status?: string;
  remark?: string;
  limit_flow?: number;
  balance?: number;
  app_username?: string;
  contact?: string;
}

export interface AgentOrder {
  id: number;
  orderNumber: string;
  userId: number;
  userAccount: string;
  amount: number;
  status: string;
  createdAt: string;
  type: 'dynamic' | 'static';
}

export interface AgentUser {
  id: number;
  account: string;
  email: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt: string;
  totalOrders: number;
  totalSpent: number;
}

export interface Agent {
  id: number;
  name: string;
}

export interface AgentListResponse {
  list: AgentInfo[];
  total: number;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}