import { useState, useEffect } from 'react';
import { resourceAPI } from '../services/api';

export interface ResourceStats {
  totalCapacity: number;
  availableCount: number;
  usedCount: number;
}

export interface ResourceFilters {
  page: number;
  pageSize: number;
  country?: string;
  region?: string;
  city?: string;
}

export function useDynamicResources(params: { page: number; pageSize: number }) {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState<ResourceStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resourcesRes, statsRes] = await Promise.all([
          resourceAPI.getDynamicResources(params),
          resourceAPI.getDynamicResourceStats()
        ]);
        setResources(resourcesRes.data);
        setStats(statsRes.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.page, params.pageSize]);

  return { resources, stats, loading, error };
}

export function useStaticResources(filters: ResourceFilters) {
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState<ResourceStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resourcesRes, statsRes] = await Promise.all([
          resourceAPI.getStaticResources(filters),
          resourceAPI.getStaticResourceStats()
        ]);
        setResources(resourcesRes.data);
        setStats(statsRes.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { resources, stats, loading, error };
}
