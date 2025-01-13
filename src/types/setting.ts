export interface ProxySettings {
  dynamicPrice: number;
  staticPrice: number;
  minDynamicDuration: number;
  minStaticDuration: number;
  maxConcurrent: number;
}

export interface SystemSettings {
  proxy: ProxySettings;
  system: {
    maintenance: boolean;
    maintenanceMessage?: string;
  };
}
