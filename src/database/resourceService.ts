import db from './index';
import type { Resource, ResourceStatistics } from '@/types/resource';

export async function getResourceList(params: {
  page: number;
  pageSize: number;
  type?: 'static' | 'dynamic';
  status?: string;
}): Promise<{ total: number; list: Resource[] }> {
  const offset = (params.page - 1) * params.pageSize;
  let query = db.resources;

  if (params.type) {
    query = query.where('type').equals(params.type);
  }

  if (params.status) {
    query = query.and(resource => resource.status === params.status);
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

export async function getResourceById(resourceId: number): Promise<Resource | undefined> {
  return db.resources.get(resourceId);
}

export async function createResource(params: {
  type: 'static' | 'dynamic';
  name: string;
  description: string;
  price: number;
}): Promise<Resource> {
  const now = new Date();
  const resourceId = await db.resources.add({
    ...params,
    status: 'active',
    createdAt: now,
    updatedAt: now
  });

  const resource = await getResourceById(resourceId);
  if (!resource) {
    throw new Error('Failed to create resource');
  }

  return resource;
}

export async function updateResource(resourceId: number, params: Partial<Resource>): Promise<void> {
  await db.resources.update(resourceId, {
    ...params,
    updatedAt: new Date()
  });
}

export async function getResourceStatistics(): Promise<ResourceStatistics> {
  const resources = await db.resources.toArray();
  const orders = await db.orders.toArray();

  const totalResources = resources.length;
  const activeResources = resources.filter(r => r.status === 'active').length;
  const staticResources = resources.filter(r => r.type === 'static').length;
  const dynamicResources = resources.filter(r => r.type === 'dynamic').length;

  const resourceUsage = resources.map(resource => {
    const resourceOrders = orders.filter(o => o.resourceId === resource.id);
    return {
      resourceId: resource.id,
      name: resource.name,
      type: resource.type,
      totalOrders: resourceOrders.length,
      activeOrders: resourceOrders.filter(o => o.status === 'active').length
    };
  });

  return {
    totalResources,
    activeResources,
    staticResources,
    dynamicResources,
    resourceUsage
  };
}
