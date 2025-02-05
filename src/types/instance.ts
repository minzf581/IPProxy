import { BaseResource } from './resource';
import { BaseOrder } from './order';

// 动态代理参数
export interface DynamicProxyParams {
  poolId: string;           // IP池ID
  trafficAmount: number;    // 流量数量(GB)
  username?: string;        // 用户名
  password?: string;        // 密码
  remark?: string;         // 备注
}

// 代理实例状态
export type ProxyInstanceStatus = 'active' | 'expired' | 'disabled';

// 代理实例类型
export interface ProxyInstance {
  id: string;
  userId: number;
  type: 'dynamic' | 'static';
  status: ProxyInstanceStatus;
  ipPool?: string;
  trafficTotal?: number;
  trafficUsed?: number;
  trafficRemaining?: number;
  expireTime?: string;
  createdAt: string;
  updatedAt?: string;
  remark?: string;
}

// IP池信息
export interface IpPool {
  id: string;
  name: string;
  type: 'dynamic' | 'static';
  price: number;
  description?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt?: string;
}

// 动态代理池接口
export interface DynamicProxyPool {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

// 开通结果
export interface OpenProxyResult {
  instance: BaseOrder;
  credentials?: {
    username: string;
    password: string;
  };
}

// 动态代理实例接口
export interface DynamicProxyInstance {
  id: string;
  poolId: string;
  trafficAmount: number;
  username: string;
  password: string;
  remark?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  expiredAt: string;
  usedTraffic: number;
  remainingTraffic: number;
} 