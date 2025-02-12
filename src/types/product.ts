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
  type?: 'dynamic' | 'static';
  area?: string;
  country?: string;
  city?: string;
} 