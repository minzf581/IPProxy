/**
 * @deprecated 这些类型将被合并到 dynamicProxy.ts 中
 */
export interface ProxyResource {
  productNo: string;
  total: number;
  used: number;
  balance: number;
  ipWhiteList: string[];
  ipUsed: number;
  ipTotal: number;
}

export interface ProxyResourceResponse {
  code: number;
  msg: string;
  data: ProxyResource[];
} 