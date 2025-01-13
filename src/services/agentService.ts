import type { AgentInfo, AgentStatistics } from '@/types/agent';
import * as dbService from '@/database/agentService';

export async function getAgentList(params: { page: number; pageSize: number; status?: string }) {
  return dbService.getAgentList(params);
}

export async function getAgentById(agentId: number): Promise<AgentInfo> {
  const agent = await dbService.getAgentById(agentId);
  if (!agent) {
    throw new Error('Agent not found');
  }
  return agent;
}

export async function getAgentStatistics(agentId: number): Promise<AgentStatistics> {
  return dbService.getAgentStatistics(agentId);
}

export async function createAgent(params: {
  name: string;
  email: string;
  password: string;
}): Promise<AgentInfo> {
  return dbService.createAgent(params);
}

export async function updateAgent(agentId: number, params: Partial<AgentInfo>): Promise<void> {
  return dbService.updateAgent(agentId, params);
}

export async function getAgentOrders(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  return dbService.getAgentOrders(params);
}

export async function getAgentUsers(params: {
  agentId: number;
  page: number;
  pageSize: number;
  status?: string;
}) {
  return dbService.getAgentUsers(params);
}
