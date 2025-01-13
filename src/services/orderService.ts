import type { DynamicOrder, StaticOrder, OrderStatistics } from '@/types/order';
import * as dbService from '@/database/orderService';

export async function getDynamicOrderList(params: {
  page: number;
  pageSize: number;
  userId?: number;
  agentId?: number;
  status?: string;
}) {
  return dbService.getDynamicOrderList(params);
}

export async function getStaticOrderList(params: {
  page: number;
  pageSize: number;
  userId?: number;
  agentId?: number;
  status?: string;
}) {
  return dbService.getStaticOrderList(params);
}

export async function createDynamicOrder(params: {
  userId: number;
  agentId?: number;
  resourceId: number;
  duration: number;
}): Promise<DynamicOrder> {
  return dbService.createDynamicOrder(params);
}

export async function createStaticOrder(params: {
  userId: number;
  agentId?: number;
  resourceId: number;
  quantity: number;
}): Promise<StaticOrder> {
  return dbService.createStaticOrder(params);
}

export async function getDynamicOrderById(orderId: number): Promise<DynamicOrder> {
  const order = await dbService.getDynamicOrderById(orderId);
  if (!order) {
    throw new Error('Dynamic order not found');
  }
  return order;
}

export async function getStaticOrderById(orderId: number): Promise<StaticOrder> {
  const order = await dbService.getStaticOrderById(orderId);
  if (!order) {
    throw new Error('Static order not found');
  }
  return order;
}

export async function updateOrder(orderId: number, params: Partial<DynamicOrder | StaticOrder>): Promise<void> {
  return dbService.updateOrder(orderId, params);
}

export async function getOrderStatistics(params: {
  userId?: number;
  agentId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<OrderStatistics> {
  return dbService.getOrderStatistics(params);
}
