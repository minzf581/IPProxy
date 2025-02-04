import { Dayjs } from 'dayjs';

export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  USER = 'user'
}

export interface User {
  id: number;
  username: string;
  email?: string;
  agent_id: number | null;  // null表示管理员
  status: 'active' | 'disabled';
  balance: number;
  is_admin: boolean;
  is_agent: boolean;
  remark?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile extends User {
  total_recharge: number;
  total_consumption: number;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  username?: string;
  status?: string;
  dateRange?: [Dayjs, Dayjs];
}

export interface UserListResponse {
  list: User[];
  total: number;
}

export interface CreateUserParams {
  username: string;
  password: string;
  email?: string;
  remark?: string;
}

export interface CreateUserForm {
  username: string;
  password: string;
  remark?: string;
}

export interface BusinessActivationForm {
  proxyType: 'dynamic' | 'static';
  dynamicPool?: string;
  trafficAmount?: number;
  region?: string;
  country?: string;
  city?: string;
  staticType?: string;
  ipRange?: string;
  duration?: number;
  quantity?: number;
  remark?: string;
}