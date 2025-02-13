/**
 * 用户服务模块
 * 
 * 此模块处理所有与用户相关的API请求，包括：
 * - 用户列表获取
 * - 用户状态管理
 * - 用户业务激活
 * 
 * 依赖说明：
 * - API基础配置：src/config/api.ts
 * - 类型定义：src/types/user.ts
 * - 工具函数：src/utils/request.ts
 * 
 * 后端对应：
 * - 路由：backend/app/routers/user.py
 * - 模型：backend/app/models/user.py
 */

import { api } from '@/utils/request';
import type { User, UserRole } from '@/types/user';
import type { ApiResponse } from '@/types/api';
import axios from 'axios';
import { API_ROUTES } from '@/shared/routes';

// Debug 函数
const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[User Service Debug]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[User Service Error]', ...args);
  }
};

// 创建用户服务专用的 axios 实例
const userApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 添加认证拦截器
userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: UserRole;
  status?: string;
}

export interface UserListResponse {
  list: User[];
  total: number;
}

export async function getUserList(params: UserListParams): Promise<ApiResponse<UserListResponse>> {
  try {
    debug.log('Getting user list with params:', params);
    const response = await userApi.get<ApiResponse<UserListResponse>>('/user/list', { params });
    debug.log('User list response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function createUser(data: any): Promise<ApiResponse<User>> {
  try {
    debug.log('Creating user:', data);
    const response = await userApi.post<ApiResponse<User>>('/open/app/user/create/v2', data);
    debug.log('Create user response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function updateUser(id: number, data: any): Promise<ApiResponse<User>> {
  try {
    debug.log('Updating user:', { id, data });
    const response = await userApi.put<ApiResponse<User>>(`/open/app/user/${id}`, data);
    debug.log('Update user response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function updateUserStatus(id: number, status: string): Promise<ApiResponse<User>> {
  try {
    debug.log('Updating user status:', { id, status });
    const response = await userApi.put<ApiResponse<User>>(`/open/app/user/${id}/status`, { status });
    debug.log('Update user status response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function deleteUser(id: number): Promise<ApiResponse<void>> {
  try {
    debug.log('Deleting user:', id);
    const response = await userApi.delete<ApiResponse<void>>(`/open/app/user/${id}`);
    debug.log('Delete user response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function changeUserPassword(id: number, newPassword: string): Promise<ApiResponse<void>> {
  try {
    debug.log('Changing user password:', { id });
    const response = await userApi.post<ApiResponse<void>>(`/open/app/user/${id}/password`, {
      password: newPassword
    });
    debug.log('Change password response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

// 为了向后兼容，导出一个别名
export const updateUserPassword = changeUserPassword;

export async function activateBusinessUser(id: number): Promise<ApiResponse<void>> {
  try {
    debug.log('Activating business user:', id);
    const response = await userApi.post<ApiResponse<void>>(`/open/app/user/${id}/activate-business`);
    debug.log('Activate business response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

export async function deactivateBusinessUser(id: number): Promise<ApiResponse<void>> {
  try {
    debug.log('Deactivating business user:', id);
    const response = await userApi.post<ApiResponse<void>>(`/open/app/user/${id}/deactivate-business`);
    debug.log('Deactivate business response:', response.data);
    return response.data;
  } catch (error: any) {
    debug.error('API error:', error);
    throw error;
  }
}

/**
 * 获取当前用户信息
 * 
 * 依赖说明：
 * - API路径: /auth/current-user
 * - 后端函数: get_user_profile (user.py)
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/current-user');
  if (!response.data || response.data.code !== 0) {
    throw new Error(response.data?.msg || '获取用户信息失败');
  }
  return response.data.data;
}

// 获取代理商列表
export async function getAgentList(): Promise<User[]> {
  const response = await api.get<ApiResponse<User[]>>('/api/agent/list');
  return response.data.data;
}

// 搜索用户
export async function searchUsers(params: any): Promise<ApiResponse<UserListResponse>> {
  const response = await api.get<ApiResponse<UserListResponse>>('/open/app/user/list', { params });
  return response.data;
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
