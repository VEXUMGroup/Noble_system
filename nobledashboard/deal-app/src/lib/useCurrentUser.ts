'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from './supabase/client';

export interface CurrentUser {
  userId: string;
  role: 'sales' | 'manager';
}

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'sales' | 'manager'>('sales');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          setError('ユーザーが認証されていません');
          setUserId(null);
          return;
        }

        // m_users テーブルから user_id と role を取得
        const { data: member, error: memberError } = await supabase
          .from('m_users')
          .select('id, role')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (memberError) throw memberError;

        if (!cancelled) {
          setUserId(member?.id ?? user.id);
          setRole((member?.role ?? 'sales') as 'sales' | 'manager');
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
