import { useState, useEffect, useCallback } from 'react';

interface RequestOptions {
  manual?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface RequestResult<T> {
  data?: T;
  loading: boolean;
  error?: Error;
  run: (...args: any[]) => Promise<any>;
  refresh: () => void;
}

export function useRequest<T = any>(
  url: string | ((...args: any[]) => string),
  options: RequestOptions = {}
): RequestResult<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(!options.manual);
  const [error, setError] = useState<Error>();

  const fetchData = useCallback(async (...args: any[]) => {
    try {
      setLoading(true);
      setError(undefined);

      const finalUrl = typeof url === 'function' ? url(...args) : url;
      const response = await fetch(finalUrl, {
        credentials: 'include',
      });

      if (response.status === 401) {
        // 未授权时重定向到登录页
        window.location.href = '/login';
        throw new Error('请先登录');
      }

      const result = await response.json();

      if (result.code === 0) {
        setData(result.data);
        options.onSuccess?.(result.data);
        return result.data;
      } else {
        throw new Error(result.message || '请求失败');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('请求失败');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    if (!options.manual) {
      fetchData();
    }
  }, [fetchData, options.manual]);

  return {
    data,
    loading,
    error,
    run: fetchData,
    refresh: () => fetchData(),
  };
}

export default useRequest; 