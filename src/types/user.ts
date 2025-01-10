export interface User {
  id: string;
  account: string;
  agentId: string;
  agentName: string;
  status: 'active' | 'disabled';
  createdAt: string;
  remark?: string;
}

export interface UpdateUserPasswordForm {
  newPassword: string;
  confirmPassword: string;
} 