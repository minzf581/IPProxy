import { api } from '@/utils/request';
import type { ApiResponse } from '@/types/api';
import type { User, UserListParams, UserListResponse, CreateUserParams } from '@/types/user';

export type { CreateUserParams };

// 获取用户列表
export async function getUserList(params: UserListParams): Promise<ApiResponse<UserListResponse>> {
  console.log('[User Service Debug] Calling getUserList with params:', params);
  const requestParams = {
    page: params.page,
    pageSize: params.pageSize,
    username: params.username,
    status: params.status,
    startTime: params.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
    endTime: params.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss')
  };
  
  try {
    const response = await api.get<UserListResponse>('/open/app/user/list', { params: requestParams });
    console.log('[User Service Debug] Raw API response:', response);
    return response;
  } catch (error) {
    console.error('[User Service Debug] API error:', error);
    throw error;
  }
}

// 更新用户状态
export async function updateUserStatus(userId: string, status: string): Promise<ApiResponse<User>> {
  const response = await api.put<User>(`/api/open/app/user/${userId}/status`, { status });
  return response;
}

// 更新用户密码
export async function updateUserPassword(userId: string, password: string): Promise<ApiResponse<User>> {
  const response = await api.put<User>(`/api/open/app/user/${userId}/password`, { password });
  return response;
}

// 创建用户
export async function createUser(data: CreateUserParams): Promise<ApiResponse<User>> {
  try {
    console.log('[Create User Service Debug] Request data:', data);
    const response = await api.post<User>('/api/open/app/user/create', data);
    console.log('[Create User Service Debug] Raw response:', response);
    console.log('[Create User Service Debug] Response data:', response);
    return response;
  } catch (error) {
    console.error('[Create User Service Debug] Error:', error);
    throw error;
  }
}

// 格式化数字为千分位格式
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

// 格式化流量大小
export function formatTraffic(gb: number): string {
  return `${gb}Gb`;
}

// 格式化数量
export function formatCount(count: number): string {
  return `${count}条`;
}

// 格式化百分比
export function formatPercent(percent: number): string {
  return `${percent}%`;
}
