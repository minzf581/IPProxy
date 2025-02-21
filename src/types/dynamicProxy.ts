export interface DynamicProxyState {
  code: string;
  name: string;
}

export interface DynamicProxyCity {
  cityCode: string;
  cityName: string;
}

export interface DynamicProxyCountry {
  countryCode: string;
  countryName: string;
  states: DynamicProxyState[];
  cities: DynamicProxyCity[];
}

export interface DynamicProxyArea {
  areaCode: string;
  areaName: string;
  countries: DynamicProxyCountry[];
}

export interface DynamicProxyProduct {
  productNo: string;
  areaCode: string;
  stateCode?: string;
  countryCode: string;
  cityCode: string;
  price: string;
  region: string;
  status: number;
}

export interface FilterOption {
  text: string;
  value: string;
}

export interface FilterOptions {
  types: FilterOption[];
  areas: FilterOption[];
  states: FilterOption[];
  countries: FilterOption[];
  cities: FilterOption[];
}

export interface DynamicProxyResponse {
  code: number;
  message: string;
  data: DynamicProxyArea[] | DynamicProxyProduct[];
}

// 枚举值导出（不使用 type）
export enum ExtractMethod {
  PASSWORD = 'password',
  API = 'api'
}

export enum Protocol {
  SOCKS5 = 'socks5',
  HTTP = 'http'
}

export enum DataFormat {
  TXT = 'txt',
  JSON = 'json'
}

export enum Delimiter {
  CRLF = 1,
  BR = 2,
  CR = 3,
  LF = 4,
  TAB = 5
}

// 类型定义（使用 type）
export type ExtractConfig = {
  method: ExtractMethod;
  // 密码提取配置
  quantity?: number;
  validTime?: number;
  // API提取配置
  protocol?: Protocol;
  dataFormat?: DataFormat;
  delimiter?: Delimiter;
}

export type ExtractResponse = {
  code: number;
  message: string;
  data: {
    url: string;
  };
}

export type ExtractParams = {
  productNo: string;
  proxyType: number;
  flow: number;
  addressCode?: string;
  maxFlowLimit?: number;
  num?: number;
  protocol?: string;
  returnType?: string;
  delimiter?: number;
  extractConfig: ExtractConfig;
} 