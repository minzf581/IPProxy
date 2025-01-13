export interface AgentInfo {
  id: number;
  account: string;
  name?: string;
  email: string;
  balance: number;
  status: 'active' | 'disabled';
  createdAt: string;
  remark?: string;
}

export interface AgentStatistics {
  totalUsers: number;
  totalOrders: number;
  totalIncome: number;
  monthlyIncome: number;
  lastMonthIncome: number;
  activeUsers: number;
  activeOrders: number;
}

export interface CreateAgentForm {
  account: string;
  password: string;
  email: string;
  name?: string;
  remark?: string;
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
  email?: string;
  name?: string;
  remark?: string;
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