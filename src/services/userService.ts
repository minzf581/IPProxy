import { request } from '@/utils/request';
import type { ApiResponse } from '@/types/api';

export interface User {
  id: string;
  username: string;
  email: string;
  status: string;
  agentAccount: string;
  balance: number;
  createdAt: string;
  remark: string;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  username?: string;
  agentAccount?: string;
  status?: string;
}

export interface UserListResponse {
  list: User[];
  total: number;
}

// 获取用户列表
export const getUserList = async (params: UserListParams): Promise<ApiResponse<UserListResponse>> => {
  return request('/api/open/app/user/list', {
    method: 'GET',
    params: {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      username: params.username,
      agentAccount: params.agentAccount
    }
  });
};

// 更新用户状态
export const updateUserStatus = async (userId: string, status: string): Promise<ApiResponse<User>> => {
  return request(`/api/open/app/user/${userId}/status`, {
    method: 'PUT',
    data: { status }
  });
};

// 更新用户密码
export const updateUserPassword = async (userId: string, password: string): Promise<ApiResponse<User>> => {
  return request(`/api/open/app/user/${userId}/password`, {
    method: 'PUT',
    data: { password }
  });
};
