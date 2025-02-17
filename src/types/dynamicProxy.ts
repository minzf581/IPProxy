export interface DynamicProxyArea {
  areaCode: string;
  areaName: string;
  countries: DynamicProxyCountry[];
}

export interface DynamicProxyCountry {
  countryCode: string;
  countryName: string;
  cities: DynamicProxyCity[];
}

export interface DynamicProxyCity {
  cityCode: string;
  cityName: string;
}

export interface FilterOption {
  text: string;
  value: string;
}

export interface FilterOptions {
  types: FilterOption[];
  areas: FilterOption[];
  countries: FilterOption[];
  cities: FilterOption[];
}

export interface DynamicProxyResponse {
  code: number;
  message: string;
  data: DynamicProxyArea[];
} 