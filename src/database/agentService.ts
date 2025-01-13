import db from './index';
import type { AgentInfo, AgentStatistics } from '@/types/agent';

export async function getAgentList(params: { page: number; pageSize: number; status?: string }) {
  const offset = (params.page - 1) * params.pageSize;
  const query = db.agents;
  
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

export async function getAgentById(agentId: number): Promise<AgentInfo | undefined> {
  return db.agents.get(agentId);
}

export async function getAgentStatistics(agentId: number): Promise<AgentStatistics> {
  const agent = await getAgentById(agentId);
  if (!agent) {
    throw new Error('Agent not found');
  }

  // Get all orders for this agent
  const orders = await db.orders
    .where('agentId')
    .equals(agentId)
    .toArray();

  // Get all users under this agent
  const users = await db.users
    .where('agentId')
    .equals(agentId)
    .toArray();

  // Calculate statistics
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status === 'active').length;
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;

  // Calculate revenue
  const transactions = await db.transactions
    .where('agentId')
    .equals(agentId)
    .toArray();

  const totalRevenue = transactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTransactions = transactions.filter(t => new Date(t.createdAt) >= monthStart);

  const monthRevenue = monthTransactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalOrders,
    activeOrders,
    totalUsers,
    activeUsers,
    totalRevenue,
    monthRevenue
  };
}

export async function createAgent(params: {
  name: string;
  email: string;
  password: string;
}): Promise<AgentInfo> {
  const now = new Date();
  const agentId = await db.agents.add({
    ...params,
    status: 'active',
    createdAt: now,
    updatedAt: now
  });
  
  const agent = await getAgentById(agentId);
  if (!agent) {
    throw new Error('Failed to create agent');
  }
  
  return agent;
}

export async function updateAgent(agentId: number, params: Partial<AgentInfo>): Promise<void> {
  await db.agents.update(agentId, {
    ...params,
    updatedAt: new Date()
  });
}

export async function getAgentOrders(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  const offset = (params.page - 1) * params.pageSize;
  const query = db.orders
    .where('agentId')
    .equals(params.agentId);

  if (params.status) {
    query.and(order => order.status === params.status);
  }

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

export async function getAgentUsers(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  const offset = (params.page - 1) * params.pageSize;
  const query = db.users
    .where('agentId')
    .equals(params.agentId);

  if (params.status) {
    query.and(user => user.status === params.status);
  }

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
