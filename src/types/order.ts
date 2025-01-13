// 订单类型
export enum OrderType {
  DYNAMIC = 'dynamic',  // 动态IP
  STATIC = 'static'     // 静态IP
}

// 订单状态
export enum OrderStatus {
  PENDING = 'pending',       // 待处理
  PROCESSING = 'processing', // 处理中
  ACTIVE = 'active',        // 使用中
  EXPIRED = 'expired',      // 已过期
  CANCELLED = 'cancelled'   // 已取消
}

// 协议类型
export enum ProtocolType {
  HTTP = 'http',
  HTTPS = 'https',
  SOCKS5 = 'socks5'
}

// 状态标签颜色映射
export const OrderStatusColors = {
  [OrderStatus.PENDING]: '#faad14',     // 黄色
  [OrderStatus.PROCESSING]: '#1890ff',  // 蓝色
  [OrderStatus.ACTIVE]: '#52c41a',      // 绿色
  [OrderStatus.EXPIRED]: '#d9d9d9',     // 灰色
  [OrderStatus.CANCELLED]: '#ff4d4f'    // 红色
};

// 状态文本映射
export const OrderStatusTexts = {
  [OrderStatus.PENDING]: '待处理',
  [OrderStatus.PROCESSING]: '处理中',
  [OrderStatus.ACTIVE]: '使用中',
  [OrderStatus.EXPIRED]: '已过期',
  [OrderStatus.CANCELLED]: '已取消'
};

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