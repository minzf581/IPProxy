import { request } from '../utils/request';
import { LocalArea } from '../types/localArea';
import { DisplayIpRange } from '../types/displayIpRange';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const ipProxyAPI = {
  // 获取区域列表
  getAreaList: async (): Promise<ApiResponse<LocalArea[]>> => {
    return request('/api/area/list');
  },

  // 根据区域获取国家列表
  getCountriesByRegion: async (regionCode: string): Promise<ApiResponse<LocalArea[]>> => {
    return request('/api/area/countries', {
      method: 'POST',
      data: { regionCode }
    });
  },

  // 根据国家获取城市列表
  getCitiesByCountry: async (countryCode: string): Promise<ApiResponse<LocalArea[]>> => {
    return request('/api/area/cities', {
      method: 'POST',
      data: { countryCode }
    });
  },

  // 获取 IP 范围列表
  getIpRanges: async (params: {
    region_code: string;
    country_code: string;
    city_code: string;
  }): Promise<ApiResponse<DisplayIpRange[]>> => {
    const requestParams = {
      regionCode: params.region_code,
      countryCode: params.country_code,
      cityCode: params.city_code,
      proxyType: 103  // 静态国外家庭
    };
    return request('/api/open/app/product/query/v2', {
      method: 'POST',
      data: requestParams
    });
  }
}; 