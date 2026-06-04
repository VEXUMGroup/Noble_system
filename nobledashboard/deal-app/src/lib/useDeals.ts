'use client';

import { useEffect, useState } from 'react';
import { getDeals, type DealFilters } from './supabase';

export function useDeals(filters?: DealFilters, refreshToken?: unknown) {
  const [deals, setDeals] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await getDeals(filters);
        if (!cancelled) setDeals(data as Record<string, unknown>[]);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'failed_to_load_deals');
          setDeals([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filters?.assigned_to, filters?.status, refreshToken]);

  return { deals, isLoading, error };
}
