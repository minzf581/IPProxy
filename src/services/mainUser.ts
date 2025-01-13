import request from '@/utils/request';
import { getUserById, updateUser } from '@/services/userService';
import { hashPassword } from '@/utils/crypto';
import type { UserInfo, UserStatistics } from '@/types/user';

export interface MainUser {
  appUsername: string;
  username: string;
  password: string;
  status: number;
  authStatus: number;
}

const MAIN_USER_KEY = 'ipproxy_main_user';

// 生产环境的默认主账号配置
const DEFAULT_PROD_USER: MainUser = {
  appUsername: 'admin',
  username: 'admin',
  password: 'admin123',
  status: 1,
  authStatus: 2
};

let currentUser: UserInfo | null = null;

export async function getCurrentUser(): Promise<UserInfo | null> {
  return currentUser;
}

export async function setCurrentUser(userId: number): Promise<void> {
  try {
    const user = await getUserById(userId);
    currentUser = user;
  } catch (error) {
    console.error('Failed to set current user:', error);
    throw error;
  }
}

export async function clearCurrentUser(): Promise<void> {
  currentUser = null;
}

export async function updateCurrentUser(params: Partial<UserInfo>): Promise<void> {
  if (!currentUser) {
    throw new Error('No current user');
  }

  await updateUser(currentUser.id, params);
  const updatedUser = await getUserById(currentUser.id);
  currentUser = updatedUser;
}

export async function updateCurrentUserPassword(oldPassword: string, newPassword: string): Promise<void> {
  if (!currentUser) {
    throw new Error('No current user');
  }

  const hashedOldPassword = await hashPassword(oldPassword);
  const hashedNewPassword = await hashPassword(newPassword);

  await updateUser(currentUser.id, {
    oldPassword: hashedOldPassword,
    password: hashedNewPassword
  });
}

export function isAdmin(): boolean {
  return currentUser?.role === 'admin';
}

export function isAgent(): boolean {
  return currentUser?.role === 'agent';
}

export function hasPermission(permission: string): boolean {
  if (!currentUser) {
    return false;
  }

  if (isAdmin()) {
    return true;
  }

  // 这里可以根据需要添加更细粒度的权限控制
  return false;
}

export async function initializeMainUser(): Promise<MainUser> {
  // 检查是否已经有主账号信息
  const savedUser = localStorage.getItem(MAIN_USER_KEY);
  if (savedUser) {
    return JSON.parse(savedUser);
  }

  // 检查是否在 GitHub Pages 环境
  const isGitHubPages = window.location.hostname === 'minzf581.github.io';
  
  if (isGitHubPages) {
    return DEFAULT_PROD_USER;
  }

  // 如果没有，创建新的主账号
  try {
    const response = await request.post('/api/users', {
      account: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
    });
    const mainUser = response.data;

    // 为主账号创建产品
    await request.post('/api/users/' + mainUser.id + '/products', {
      name: 'Admin Product',
    });

    // 只在本地环境保存主账号信息
    localStorage.setItem(MAIN_USER_KEY, JSON.stringify(mainUser));
    return mainUser;
  } catch (error) {
    console.error('Failed to initialize main user:', error);
    throw error;
  }
}

export function getMainUser(): MainUser | null {
  // 检查是否在 GitHub Pages 环境
  const isGitHubPages = window.location.hostname === 'minzf581.github.io';
  
  if (isGitHubPages) {
    return DEFAULT_PROD_USER;
  }

  // 本地开发环境：使用 localStorage
  const savedUser = localStorage.getItem(MAIN_USER_KEY);
  return savedUser ? JSON.parse(savedUser) : null;
}
