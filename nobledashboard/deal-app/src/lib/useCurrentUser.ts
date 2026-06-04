'use client';

import { useEffect, useState } from 'react';

export interface CurrentUser {
  userId: string;
  role: 'sales' | 'manager';
}

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'sales' | 'manager' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          setError('ユーザーが認証されていません');
          setUserId(null);
          return;
        }
        const payload = (await res.json()) as { userId?: string | null; role?: string | null };
        if (!cancelled) {
          setUserId(payload.userId ?? null);
          setRole(payload.role === 'manager' ? 'manager' : 'sales');
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'ユーザー情報の取得に失敗しました');
          setUserId(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { userId, role, isLoading, error };
}
