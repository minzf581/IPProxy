export interface User {
  id: string;
  account: string;
  agentId: string;
  agentName: string;
  status: 'active' | 'disabled';
  createdAt: string;
  remark?: string;
}

export interface UserInfo {
  id: number;
  account: string;
  email: string;
  status: 'active' | 'disabled';
  balance: number;
  agentId?: number;
  agentAccount?: string;
  apiKey?: string;
  createdAt: string;
  lastLoginAt?: string;
  remark?: string;
}

export interface UserStatistics {
  totalOrders: number;
  totalSpent: number;
  monthlySpent: number;
  lastMonthSpent: number;
  dynamicOrders: {
    total: number;
    active: number;
    amount: number;
  };
  staticOrders: {
    total: number;
    active: number;
    amount: number;
  };
}

export interface BalanceHistory {
  id: number;
  userId: number;
  amount: number;
  type: 'recharge' | 'consume' | 'refund';
  orderId?: number;
  createdAt: string;
  remark: string;
}

export interface LoginHistory {
  id: number;
  userId: number;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

export interface CreateUserForm {
  account: string;
  password: string;
  email: string;
  agentId?: number;
  remark?: string;
}

export interface UpdateUserForm {
  email?: string;
  remark?: string;
}

export interface UpdateUserPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export interface UpdatePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}