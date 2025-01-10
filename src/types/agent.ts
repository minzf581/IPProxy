export interface Agent {
  id: string;
  account: string;
  name?: string;
  balance: number;
  status: 'active' | 'disabled';
  createdAt: string;
  remark?: string;
}

export interface CreateAgentForm {
  account: string;
  password: string;
  name?: string;
  remark?: string;
}

export interface UpdatePasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateBalanceForm {
  amount: number;
  type: 'increase' | 'decrease';
} 