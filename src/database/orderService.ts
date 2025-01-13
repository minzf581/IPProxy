import db from './index';
import type { DynamicOrder, StaticOrder, OrderStatistics } from '@/types/order';

export async function getDynamicOrderList(params: {
  page: number;
  pageSize: number;
  userId?: number;
  agentId?: number;
  status?: string;
}) {
  const offset = (params.page - 1) * params.pageSize;
  let query = db.orders.where('type').equals('dynamic');

  if (params.userId) {
    query = query.and(order => order.userId === params.userId);
  }

  if (params.agentId) {
    query = query.and(order => order.agentId === params.agentId);
  }

  if (params.status) {
    query = query.and(order => order.status === params.status);
  }

  const total = await query.count();
  const list = await query
    .reverse()
    .offset(offset)
    .limit(params.pageSize)
    .toArray();

  return {
    total,
    list: list as DynamicOrder[]
  };
}

export async function getStaticOrderList(params: {
  page: number;
  pageSize: number;
  userId?: number;
  agentId?: number;
  status?: string;
}) {
  const offset = (params.page - 1) * params.pageSize;
  let query = db.orders.where('type').equals('static');

  if (params.userId) {
    query = query.and(order => order.userId === params.userId);
  }

  if (params.agentId) {
    query = query.and(order => order.agentId === params.agentId);
  }

  if (params.status) {
    query = query.and(order => order.status === params.status);
  }

  const total = await query.count();
  const list = await query
    .reverse()
    .offset(offset)
    .limit(params.pageSize)
    .toArray();

  return {
    total,
    list: list as StaticOrder[]
  };
}

export async function createDynamicOrder(params: {
  userId: number;
  agentId?: number;
  resourceId: number;
  duration: number;
}): Promise<DynamicOrder> {
  const now = new Date();
  const orderId = await db.orders.add({
    ...params,
    type: 'dynamic',
    status: 'active',
    createdAt: now,
    updatedAt: now
  });

  const order = await db.orders.get(orderId) as DynamicOrder;
  if (!order) {
    throw new Error('Failed to create dynamic order');
  }

  return order;
}

export async function createStaticOrder(params: {
  userId: number;
  agentId?: number;
  resourceId: number;
  quantity: number;
}): Promise<StaticOrder> {
  const now = new Date();
  const orderId = await db.orders.add({
    ...params,
    type: 'static',
    status: 'active',
    createdAt: now,
    updatedAt: now
  });

  const order = await db.orders.get(orderId) as StaticOrder;
  if (!order) {
    throw new Error('Failed to create static order');
  }

  return order;
}

export async function getDynamicOrderById(orderId: number): Promise<DynamicOrder | undefined> {
  const order = await db.orders.get(orderId);
  if (order?.type !== 'dynamic') {
    return undefined;
  }
  return order as DynamicOrder;
}

export async function getStaticOrderById(orderId: number): Promise<StaticOrder | undefined> {
  const order = await db.orders.get(orderId);
  if (order?.type !== 'static') {
    return undefined;
  }
  return order as StaticOrder;
}

export async function updateOrder(orderId: number, params: Partial<DynamicOrder | StaticOrder>): Promise<void> {
  await db.orders.update(orderId, {
    ...params,
    updatedAt: new Date()
  });
}

export async function getOrderStatistics(params: {
  userId?: number;
  agentId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<OrderStatistics> {
  let query = db.orders;

  if (params.userId) {
    query = query.where('userId').equals(params.userId);
  }

  if (params.agentId) {
    query = query.where('agentId').equals(params.agentId);
  }

  const orders = await query.toArray();

  let filteredOrders = orders;
  if (params.startDate) {
    filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= params.startDate!);
  }
  if (params.endDate) {
    filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) <= params.endDate!);
  }

  const dynamicOrders = filteredOrders.filter(o => o.type === 'dynamic');
  const staticOrders = filteredOrders.filter(o => o.type === 'static');

  return {
    totalOrders: filteredOrders.length,
    dynamicOrders: dynamicOrders.length,
    staticOrders: staticOrders.length,
    activeOrders: filteredOrders.filter(o => o.status === 'active').length,
    completedOrders: filteredOrders.filter(o => o.status === 'completed').length,
    cancelledOrders: filteredOrders.filter(o => o.status === 'cancelled').length
  };
}
