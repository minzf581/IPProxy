export interface DisplayIpRange {
  id: string;
  start_ip: string;
  end_ip: string;
  region_code: string;
  country_code: string;
  city_code: string;
  region_name: string;
  country_name: string;
  city_name: string;
  cost: number;
  selected?: boolean;
} 