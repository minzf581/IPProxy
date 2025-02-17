import request from '@/utils/request';
import type { BusinessResponse } from '@/types/business';
import { API_PREFIX } from '@/shared/routes';

export async function getDynamicProxyProducts(): Promise<BusinessResponse> {
  return request(`${API_PREFIX.BUSINESS}/dynamic-proxy/products`, {
    method: 'GET'
  });
}

export async function getDynamicProxyAreas(params: {
  productNo: string;
  proxyType: number;
}): Promise<BusinessResponse> {
  return request(`${API_PREFIX.BUSINESS}/dynamic-proxy/areas`, {
    method: 'GET',
    params
  });
}

export async function saveDynamicProxyAreas(data: {
  areas: Array<{
    areaCode: string;
    areaName: string;
    countries: Array<{
      countryCode: string;
      countryName: string;
      cities: Array<{
        cityCode: string;
        cityName: string;
      }>;
    }>;
  }>;
}): Promise<BusinessResponse> {
  return request(`${API_PREFIX.BUSINESS}/dynamic-proxy/areas`, {
    method: 'POST',
    data
  });
}