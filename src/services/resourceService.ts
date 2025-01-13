import type { Resource, ResourceStatistics } from '@/types/resource';
import * as dbService from '@/database/resourceService';

export async function getResourceList(params: {
  page: number;
  pageSize: number;
  type?: 'static' | 'dynamic';
  status?: string;
}): Promise<{ total: number; list: Resource[] }> {
  return dbService.getResourceList(params);
}

export async function getResourceById(resourceId: number): Promise<Resource> {
  const resource = await dbService.getResourceById(resourceId);
  if (!resource) {
    throw new Error('Resource not found');
  }
  return resource;
}

export async function createResource(params: {
  type: 'static' | 'dynamic';
  name: string;
  description: string;
  price: number;
}): Promise<Resource> {
  return dbService.createResource(params);
}

export async function updateResource(resourceId: number, params: Partial<Resource>): Promise<void> {
  return dbService.updateResource(resourceId, params);
}

export async function getResourceStatistics(): Promise<ResourceStatistics> {
  return dbService.getResourceStatistics();
}
