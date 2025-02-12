// 产品编号映射
export const PRODUCT_NO_MAP: Record<string, string> = {
  // 动态代理
  'out_dynamic_1': '动态国外代理',
  'out_dynamic_2': '动态国内代理',
  
  // 静态云平台代理
  'aws_light_206': '静态云平台代理',
  
  // 数据中心代理
  'ipideash_598': '韩国数据中心代理',
  'ipideash_599': '日本数据中心代理',
  'ipideash_600': '新加坡数据中心代理',
  'ipideash_601': '香港数据中心代理',
  'ipideash_602': '台湾数据中心代理',
  'ipideash_603': '德国数据中心代理',
  'ipideash_604': '美国数据中心代理',
  'ipideash_605': '英国数据中心代理',
  
  // 静态住宅代理
  'mb_gmhd5exp2': '静态手机代理',
  'jp_static_101': '日本静态代理',
  'us_static_101': '美国静态代理',
  'uk_static_101': '英国静态代理',
  'kr_static_101': '韩国静态代理',
  'sg_static_101': '新加坡静态代理',
  'hk_static_101': '香港静态代理',
  'tw_static_101': '台湾静态代理',
  'de_static_101': '德国静态代理'
};

// 代理类型映射
export const PROXY_TYPE_MAP: Record<number, string> = {
  101: '静态云平台',
  102: '静态国内家庭',
  103: '静态国外家庭',
  104: '动态国外代理',
  105: '动态国内代理',
};

// 区域映射
export const AREA_MAP: Record<string, string> = {
  'AS': '亚洲',
  'EU': '欧洲',
  'NA': '北美',
  'SA': '南美',
  'AF': '非洲',
  'OC': '大洋洲',
  '1': '亚洲',
  '2': '欧洲',
  '3': '北美',
  '4': '南美',
  '5': '非洲',
  '6': '大洋洲',
  '7': '全球',
  '8': '其他'
};

// 国家映射
export const COUNTRY_MAP: Record<string, string> = {
  'CN': '中国',
  'US': '美国',
  'GB': '英国',
  'DE': '德国',
  'FR': '法国',
  'JP': '日本',
  'KR': '韩国',
  'SG': '新加坡',
  'HK': '香港',
  'TW': '台湾',
  'AU': '澳大利亚',
  'NZ': '新西兰',
  'CA': '加拿大',
  'BR': '巴西',
  'AR': '阿根廷',
  'RU': '俄罗斯',
  'IN': '印度',
  'ID': '印度尼西亚',
  'TH': '泰国',
  'VN': '越南',
  'MY': '马来西亚',
  'PH': '菲律宾',
  'USA': '美国',
  'GBR': '英国',
  'DEU': '德国',
  'FRA': '法国',
  'JPN': '日本',
  'KOR': '韩国',
  'SGP': '新加坡',
  'HKG': '香港',
  'TWN': '台湾',
  'AUS': '澳大利亚',
  'NZL': '新西兰',
  'CAN': '加拿大',
  'BRA': '巴西',
  'ARG': '阿根廷',
  'RUS': '俄罗斯',
  'IND': '印度',
  'IDN': '印度尼西亚',
  'THA': '泰国',
  'VNM': '越南',
  'MYS': '马来西亚',
  'PHL': '菲律宾',
  'CHN': '中国',
  'ESP': '西班牙',
  'ITA': '意大利',
  'NLD': '荷兰',
  'POL': '波兰',
  'TUR': '土耳其',
  'MEX': '墨西哥',
  'CHL': '智利',
  'COL': '哥伦比亚',
  'ZAF': '南非',
  'EGY': '埃及',
  'SAU': '沙特阿拉伯',
  'ARE': '阿联酋',
  'ISR': '以色列',
  'PAK': '巴基斯坦',
  'BGD': '孟加拉国',
  'NPL': '尼泊尔',
  'LKA': '斯里兰卡'
};

// 城市映射
export const CITY_MAP: Record<string, string> = {
  // 中国城市
  'BJS': '北京',
  'SHA': '上海',
  'CAN': '广州',
  'SZX': '深圳',
  'CTU': '成都',
  'HGH': '杭州',
  
  // 美国城市
  'LAX': '洛杉矶',
  'NYC': '纽约',
  'SFO': '旧金山',
  'CHI': '芝加哥',
  'SEA': '西雅图',
  'USA0CALAX': '洛杉矶',
  'USA0NYJFK': '纽约',
  'USA0CASFO': '旧金山',
  
  // 日本城市
  'TYO': '东京',
  'OSA': '大阪',
  'JPN000000': '东京',
  'JPN0TYTYO': '东京',
  'JPN0OSOSA': '大阪',
  
  // 韩国城市
  'SEL': '首尔',
  'PUS': '釜山',
  'KOR000000': '首尔',
  'KOR0SLSEL': '首尔',
  
  // 新加坡城市
  'SIN': '新加坡',
  'SGP000000': '新加坡',
  
  // 香港
  'HKG': '香港',
  'HKG000000': '香港',
  
  // 台湾城市
  'TPE': '台北',
  'KHH': '高雄',
  'TWN000000': '台北',
  'TWN0TPTPE': '台北',
  
  // 英国城市
  'LON': '伦敦',
  'MAN': '曼彻斯特',
  'GBR000000': '伦敦',
  'GBR0LDLON': '伦敦',
  
  // 德国城市
  'FRA': '法兰克福',
  'MUC': '慕尼黑',
  'DEU000000': '法兰克福',
  'DEU0HEFFR': '法兰克福',
  
  // 法国城市
  'PAR': '巴黎',
  'MRS': '马赛',
  'FRA000000': '巴黎',
  'FRA0PRPAR': '巴黎',
  
  // 澳大利亚城市
  'SYD': '悉尼',
  'MEL': '墨尔本',
  'AUS000000': '悉尼',
  'AUS0SYSYD': '悉尼',
  
  // 加拿大城市
  'YVR': '温哥华',
  'YYZ': '多伦多',
  'CAN000000': '多伦多',
  'CAN0ONTOR': '多伦多'
};

// 工具函数：获取映射值或返回原值
export const getMappedValue = <T extends string | number>(map: Record<T, string>, key: T): string => {
  return map[key] || String(key);
};

// 工具函数：从数据列表中提取唯一值
export const getUniqueValues = <T>(list: T[], key: keyof T): string[] => {
  const uniqueSet = new Set(list.map(item => String(item[key])).filter(Boolean));
  return Array.from(uniqueSet).sort();
};

// 工具函数：根据区域获取对应的国家列表
export const getCountriesByArea = (area: string): string[] => {
  const areaCountryMap: Record<string, string[]> = {
    'AS': ['CN', 'JP', 'KR'],
    'EU': ['GB', 'DE', 'FR'],
    'NA': ['US', 'CA'],
    'SA': ['BR', 'AR'],
    'AF': ['ZA', 'EG'],
    'OC': ['AU', 'NZ']
  };
  return areaCountryMap[area] || [];
};

// 更新工具函数：根据国家获取对应的城市列表
export const getCitiesByCountry = (country: string): string[] => {
  const countryToCities: Record<string, string[]> = {
    'CN': ['BJS', 'SHA', 'CAN', 'SZX', 'CTU', 'HGH'],
    'US': ['LAX', 'NYC', 'SFO', 'CHI', 'SEA'],
    'JP': ['TYO', 'OSA'],
    'KR': ['SEL', 'PUS'],
    'SG': ['SIN'],
    'HK': ['HKG'],
    'TW': ['TPE', 'KHH'],
    'GB': ['LON', 'MAN'],
    'DE': ['FRA', 'MUC'],
    'FR': ['PAR', 'MRS'],
    'AU': ['SYD', 'MEL'],
    'CA': ['YVR', 'YYZ']
  };
  return countryToCities[country] || [];
}; 