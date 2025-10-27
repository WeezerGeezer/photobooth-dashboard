import { useState, useEffect, useCallback } from 'react';
import { Booth } from '../types/booth';
import { boothAPI } from '../services/api';

export const useBooths = (refreshInterval = 30000) => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooths = useCallback(async () => {
    try {
      setLoading(true);
      const data = await boothAPI.getAllBooths();
      setBooths(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch booths');
      console.error('Error fetching booths:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooths();
    const interval = setInterval(fetchBooths, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchBooths, refreshInterval]);

  return { booths, loading, error, refetch: fetchBooths };
};

export const useBooth = (boothId: string | undefined) => {
  const [booth, setBooth] = useState<Booth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boothId) return;

    const fetchBooth = async () => {
      try {
        setLoading(true);
        const data = await boothAPI.getBoothById(boothId);
        setBooth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch booth');
        console.error('Error fetching booth:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooth();
    const interval = setInterval(fetchBooth, 30000);
    return () => clearInterval(interval);
  }, [boothId]);

  return { booth, loading, error };
};
