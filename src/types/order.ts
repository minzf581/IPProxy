export interface AgentOrder {
  id: string;
  orderNo: string;
  agentId: string;
  agentName: string;
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export interface OrderSearchParams {
  orderNo?: string;
  agentId?: string;
  status?: string;
  timeRange?: [string, string];
}

export interface UserDynamicOrder {
  id: string;
  orderNo: string;
  userId: string;
  userAccount: string;
  agentId: string;
  agentName: string;
  duration: string;  // 时长
  remark?: string;   // 备注
  createdAt: string; // 创建时间
}

export interface UserDynamicOrderSearchParams {
  orderNo?: string;
  userAccount?: string;
  agentId?: string;
}

export interface UserStaticOrder {
  id: string;
  orderNo: string;
  userId: string;
  userAccount: string;
  agentId: string;
  agentName: string;
  ipInfo: {
    subnet: string;      // IP子网
    port: string;        // 端口
    username: string;    // 用户名
    password: string;    // 密码
    country: string;     // 国家
    city: string;       // 城市
    resourceType: 'static1' | 'static2' | 'static3'; // 静态资源类型
  };
  status: 'active' | 'expired';
  createdAt: string;
  expiredAt: string;
  remark?: string;
}

export interface UserStaticOrderSearchParams {
  orderNo?: string;
  userAccount?: string;
  agentId?: string;
  ipSubnet?: string;
  resourceType?: string;
} 