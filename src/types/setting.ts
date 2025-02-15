export interface ProxySettings {
  dynamicPrice: number;
  staticPrice: number;
  minDynamicDuration: number;
  minStaticDuration: number;
  maxConcurrent: number;
}

export interface PriceSettings {
  minAgentPrice: number;    // 最低代理价格
  globalPrice: number;      // 全局价格
  updatedAt?: string;       // 更新时间
}

export interface ProductPriceSettings {
  productId: string;
  minAgentPrice: number;
  globalPrice: number;
  type: string;            // 产品类型
}

export interface SystemSettings {
  proxy: ProxySettings;
  system: {
    maintenance: boolean;
    maintenanceMessage?: string;
  };
}
