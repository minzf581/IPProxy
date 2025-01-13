import type { UserInfo, UserStatistics } from '@/types/user';
import * as dbService from '@/database/userService';

export async function getUserList(params: { page: number; pageSize: number; status?: string }) {
  return dbService.getUserList(params);
}

export async function getUserById(userId: number): Promise<UserInfo> {
  const user = await dbService.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

export async function createUser(params: {
  username: string;
  password: string;
  email: string;
}): Promise<UserInfo> {
  return dbService.createUser(params);
}

export async function updateUser(userId: number, params: Partial<UserInfo>): Promise<void> {
  return dbService.updateUser(userId, params);
}

export async function getUserStatistics(userId: number): Promise<UserStatistics> {
  return dbService.getUserStatistics(userId);
}

export async function getBalanceHistory(params: {
  userId: number;
  page: number;
  pageSize: number;
}) {
  return dbService.getBalanceHistory(params);
}

export async function getLoginHistory(params: {
  userId: number;
  page: number;
  pageSize: number;
}) {
  return dbService.getLoginHistory(params);
}
