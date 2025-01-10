export interface StaticIP {
  id: string;
  subnet: string;      // IP子网
  port: string;        // 端口
  username: string;    // 用户名
  password: string;    // 密码
  status: 'available' | 'used' | 'expired';
  user?: string;       // 使用者账号
  country: string;     // 国家
  city: string;        // 城市
  resourceType: 'static1' | 'static2' | 'static3'; // 静态资源类型
  expiredTime?: string; // 过期时间
}

export interface IPStats {
  total: number;
  available: number;
  expired: number;
}

export interface IPSearchParams {
  subnet?: string;
  status?: string;
  user?: string;
  country?: string;
  city?: string;
  resourceType?: string;
} 