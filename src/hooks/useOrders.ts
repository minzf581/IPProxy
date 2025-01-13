import { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';

export interface OrderFilters {
  page: number;
  pageSize: number;
  status?: 'pending' | 'paid' | 'active' | 'expired';
}

export interface OrderStats {
  totalOrders: number;
  totalAmount: number;
  activeOrders: number;
}

export function useDynamicOrders(filters: OrderFilters) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await orderAPI.getDynamicOrders(filters);
        setOrders(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters]);

  const createOrder = async (duration: number) => {
    try {
      const response = await orderAPI.createDynamicOrder({ duration });
      setOrders(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { orders, loading, error, createOrder };
}

export function useStaticOrders(filters: OrderFilters) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await orderAPI.getStaticOrders(filters);
        setOrders(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters]);

  const createOrder = async (data: { resourceType: string; location?: string }) => {
    try {
      const response = await orderAPI.createStaticOrder(data);
      setOrders(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { orders, loading, error, createOrder };
}
