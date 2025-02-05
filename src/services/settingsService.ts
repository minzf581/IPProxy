import { api } from '@/utils/request';
import { message } from 'antd';

export interface ResourcePrices {
  dynamic_proxy_price: number;  // 动态代理价格
  static_proxy_price: number;   // 静态代理价格
}

// 默认价格配置
const DEFAULT_PRICES: ResourcePrices = {
  dynamic_proxy_price: 5.0,  // 动态代理默认价格：5元/GB
  static_proxy_price: 10.0   // 静态代理默认价格：10元/IP
};

// 获取资源价格设置
export const getResourcePrices = async (agentId: string): Promise<ResourcePrices> => {
  try {
    const { data: responseData } = await api.get(`/settings/agent/${agentId}/prices`);
    
    // 检查响应格式
    if (responseData && responseData.code === 0 && responseData.data) {
      const priceData = responseData.data;
      return {
        dynamic_proxy_price: priceData.dynamic?.pool1 || DEFAULT_PRICES.dynamic_proxy_price,
        static_proxy_price: priceData.static?.residential || DEFAULT_PRICES.static_proxy_price
      };
    }
    
    console.warn('获取价格设置返回异常:', responseData);
    message.warning('获取价格设置失败，使用默认价格');
    return DEFAULT_PRICES;
  } catch (error: any) {
    console.error('获取价格设置失败:', error);
    if (error.response?.status === 404) {
      message.warning('代理商不存在或未设置价格，使用默认价格');
    } else if (error.response?.status === 403) {
      message.error('没有权限查看价格设置');
    } else {
      message.error('获取价格设置失败，请检查网络连接');
    }
    return DEFAULT_PRICES;
  }
};

// 更新资源价格设置
export const updateResourcePrices = async (agentId: string, prices: ResourcePrices): Promise<boolean> => {
  try {
    const response = await api.post(`/settings/agent/${agentId}/prices`, prices);
    if (response.code === 0) {
      message.success('价格设置更新成功');
      return true;
    }
    throw new Error('更新价格设置失败');
  } catch (error: any) {
    console.error('更新价格设置失败:', error);
    if (error.response?.status === 404) {
      message.error('代理商不存在');
    } else if (error.response?.status === 403) {
      message.error('没有权限更新价格设置');
    } else {
      message.error('更新价格设置失败，请检查网络连接');
    }
    return false;
  }
}; 