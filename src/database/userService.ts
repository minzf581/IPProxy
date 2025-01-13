import db from './index';
import { UserInfo, UserStatistics } from '@/types/user';

export async function getUserList(params: { page: number; pageSize: number; status?: string }) {
  const offset = (params.page - 1) * params.pageSize;
  const query = db.users;
  
  if (params.status) {
    query.where('status').equals(params.status);
  }

  const total = await query.count();
  const list = await query
    .offset(offset)
    .limit(params.pageSize)
    .toArray();

  return {
    total,
    list
  };
}

export async function getUserById(userId: number): Promise<UserInfo | undefined> {
  return db.users.get(userId);
}

export async function createUser(params: {
  username: string;
  password: string;
  email: string;
}): Promise<UserInfo> {
  const now = new Date();
  const userId = await db.users.add({
    ...params,
    status: 'active',
    createdAt: now,
    updatedAt: now
  });
  
  return getUserById(userId);
}

export async function updateUser(userId: number, params: Partial<UserInfo>): Promise<void> {
  await db.users.update(userId, {
    ...params,
    updatedAt: new Date()
  });
}

export async function getUserStatistics(userId: number): Promise<UserStatistics> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const transactions = await db.transactions
    .where('userId')
    .equals(userId)
    .toArray();

  const totalRecharge = transactions
    .filter(t => t.type === 'recharge')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalConsumption = transactions
    .filter(t => t.type === 'consumption')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalRecharge - totalConsumption;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTransactions = transactions.filter(t => new Date(t.createdAt) >= monthStart);

  const monthRecharge = monthTransactions
    .filter(t => t.type === 'recharge')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthConsumption = monthTransactions
    .filter(t => t.type === 'consumption')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalRecharge,
    totalConsumption,
    balance,
    monthRecharge,
    monthConsumption
  };
}

export async function getBalanceHistory(params: {
  userId: number;
  page: number;
  pageSize: number;
}) {
  const offset = (params.page - 1) * params.pageSize;
  const query = db.transactions
    .where('userId')
    .equals(params.userId);

  const total = await query.count();
  const list = await query
    .reverse()
    .offset(offset)
    .limit(params.pageSize)
    .toArray();

  return {
    total,
    list
  };
}

export async function getLoginHistory(params: {
  userId: number;
  page: number;
  pageSize: number;
}) {
  // 由于登录历史是一个新的需求，我们需要创建一个新的表来存储
  // 这里暂时返回空数据
  return {
    total: 0,
    list: []
  };
}
