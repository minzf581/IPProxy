export interface ApiResponse<T> {
  reqId?: string;
  code: number;
  msg: string;
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
  name?: string;     // 城市英文名
  cname: string;     // 城市中文名
  cityCode?: string; // 兼容旧版 API
  cityName?: string; // 兼容旧版 API
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
}

export interface IpRangeParams {
  areaCode: string;
  countryCode: string;
  cityCode: string;
  type: string;
  staticType: string;
  version: string;
}

export interface IpRangeStock {
  stock: number;
} 