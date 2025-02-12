export interface ApiResponse<T = any> {
  code: number;
  message: string;
  msg?: string;
  data: T;
}

export interface ApiRequestParams {
  version?: string;
  encrypt?: string;
  appKey?: string;
  reqId?: string;
  timestamp?: string;
  params?: string;
  sign?: string;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

export interface BaseSearchParams extends PaginationParams {
  keyword?: string;
  startTime?: string;
  endTime?: string;
  status?: string | number;
  username?: string;
  appUsername?: string;
}

export interface RegionStock {
  stock: number;
}

export interface Region {
  code: string;
  name: string;
}

export interface Country {
  countryCode: string;
  countryName: string;
  cityList: City[];
}

export interface City {
  code: string;      // 城市代码
  name: string;      // 城市英文名
  cname: string;     // 城市中文名
  cityCode?: string; // 兼容旧版 API
  cityName?: string; // 兼容旧版 API
  countryCode?: string; // 国家代码
}

export interface Area {
  areaCode: string;
  areaName: string;
  countryList: Country[];
}

export interface ProductStock {
  productNo: string;
  productName: string;
  stock: number;
  price: number;
}

export interface AppInfo {
  appId: string;
  appKey: string;
  appName: string;
  status: number;
  balance: number;
  createTime: string;
}

export enum ProxyType {
  DYNAMIC_FOREIGN = 104,
  DYNAMIC_DOMESTIC = 105,
}

export enum ProtocolType {
  SOCKS5 = 1,
  HTTP = 2,
  HTTPS = 3,
  SSH = 4,
}

export enum DurationUnit {
  DAY = 1,
  WEEK = 2,
  MONTH = 3,
  YEAR = 4,
  UNLIMITED = 10,
}

export enum IspType {
  UNKNOWN = 0,
  SINGLE = 1,
  DUAL = 2,
  NATIVE = 3,
  DATACENTER = 4,
}

export interface StaticType {
  code: string;
  name: string;
  price: number;
}

export interface IpRange {
  ipStart: string;
  ipEnd: string;
  ipCount: number;
  stock: number;
  staticType: string;
  countryCode: string;
  cityCode: string;
  regionCode: string;
  price: number;
  status: number;
}

export interface IpRangeParams {
  proxyType: number;  // 代理类型 (101=静态云平台, 102=静态国内家庭, 103=静态国外家庭)
  regionCode?: string;  // 区域代码
  countryCode?: string;  // 国家代码
  cityCode?: string;  // 城市代码
  staticType?: string;  // 静态代理类型
  version?: string;  // API版本
}

export interface IpRangeStock {
  stock: number;
}

export interface ProductQueryParams {
  proxyType: number;  // 代理类型 (101=静态云平台, 102=静态国内家庭, 103=静态国外家庭)
  regionCode?: string;  // 区域代码
  countryCode?: string;  // 国家代码
  cityCode?: string;  // 城市代码
  staticType?: string;  // 静态代理类型
  version?: string;  // API版本
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

export interface ProductQueryResponse {
  code: number;
  msg: string;
  data: Product[];
}

export interface AreaResponse {
  code: string;    // 地域代码
  name?: string;   // 地域名称
  cname: string;   // 地域中文名
  children?: AreaResponse[]; // 下级地域
  countryList?: Array<{
    countryCode: string;
    countryName: string;
    cityList: Array<{
      cityCode: string;
      cityName: string;
    }>;
  }>;
}

export interface CityResponse {
  code: number;
  msg: string;
  data: Array<{
    cityCode: string;
    cityName: string;
    countryCode: string;
  }>;
}

export interface ProductPrice {
  id: number;
  type: 'dynamic' | 'static';
  area: string;
  country: string;
  city: string;
  ipRange: string;
  price: number;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPriceParams {
  isGlobal?: boolean;
  agentId?: number;
  type?: string;
  area?: string;
  country?: string;
  city?: string;
  sync?: boolean;  // 是否同步产品库存
}