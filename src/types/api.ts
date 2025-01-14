export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  data: T[];
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
  startDate?: string;
  endDate?: string;
  status?: string;
} 