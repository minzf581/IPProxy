export interface ProductPrice {
  id: string;
  type: string;  // 产品编号，例如：STATIC_USA_LAX_1
  proxyType: number;  // 代理类型 (101=静态云平台, 102=静态国内家庭, 103=静态国外家庭, 104=动态国外代理, 105=动态国内代理, 201=其他动态代理)
  area: string;  // 区域代码，对应 AREA_MAP 中的键
  country?: string;  // 国家代码，对应 COUNTRY_MAP 中的键
  city?: string;  // 城市代码
  ipRange: string;  // IP段范围，格式：起始IP-结束IP
  price: number;  // 价格，精确到小数点后1位
  isGlobal: boolean;  // 是否为全局价格
  stock: number;
  minAgentPrice: number;
  globalPrice: number;
  updatedAt: string;  // 更新时间
  createdAt: string;  // 创建时间
  key?: number;  // 表格渲染用的key
}

export interface ProductPriceUpdate {
  price: number;
  agentId?: number | null;
  proxyType?: number;
}

export interface ProductPriceParams {
  is_global?: boolean;
  agent_id?: number;
  type?: string;
  area?: string;
  country?: string;
  city?: string;
  types?: string[];
  price_type?: 'min_agent' | 'global';
  proxy_types?: number[];  // 添加代理类型过滤参数
}

export interface ProductStock {
  productId: string;
  stock: number;
  updatedAt: string;
}

export interface Product {
  productNo: string;  // 产品编号
  productName: string;  // 产品名称
  proxyType: number;  // 代理类型
  useType: string;  // 使用类型
  protocol: string;  // 协议
  useLimit: number;  // 使用限制
  sellLimit: number;  // 销售限制
  areaCode: string;  // 区域代码
  countryCode: string;  // 国家代码
  stateCode: string;  // 州省代码
  cityCode: string;  // 城市代码
  detail: string;  // 商品描述
  costPrice: number;  // 价格
  inventory: number;  // 库存
  ipType: number;  // ip类型
  ispType: number;  // isp类型
  netType: number;  // 网络类型
  duration: number;  // 时长
  unit: number;  // 单位
  bandWidth: number;  // 带宽
  bandWidthPrice: number;  // 额外带宽价格
  maxBandWidth: number;  // 最大带宽
  flow: number;  // 流量包大小
  cpu: number;  // CPU数量
  memory: number;  // 内存容量
  enable: number;  // 是否可购买
  supplierCode: string;  // 供应商代码
  ipCount: number;  // IP数量
  ipDuration: number;  // IP时长
  assignIp: number;  // 是否支持指定IP
  cidrStatus: number;  // 是否支持网段
}

export interface ProductPriceSettings {
  productId: string;
  minAgentPrice: number;
  globalPrice: number;
  type: string;
} 