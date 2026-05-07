'use client';

import { useEffect, useState } from 'react';
import {
  type MUser,
  type MSource,
  type MPlan,
  type MAgency,
  getSources,
  getPlans,
  getAgencies,
  getUsers,
} from './supabase';

/**
 * useMasterData
 *
 * 4つのマスタ（流入経路 / 成約プラン / 代理店 / 担当者）を
 * 一括ロードして、各画面のプルダウン用に提供するフック。
 *
 * - is_active = true のものだけ取得
 * - 取得失敗時は空配列のままになる（呼び出し側で fallback を持つこと）
 */
export function useMasterData() {
  const [sources, setSources] = useState<MSource[]>([]);
  const [plans, setPlans] = useState<MPlan[]>([]);
  const [agencies, setAgencies] = useState<MAgency[]>([]);
  const [users, setUsers] = useState<MUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, p, a, u] = await Promise.all([
          getSources(true),
          getPlans(true),
          getAgencies(true),
          getUsers(true),
        ]);
        if (cancelled) return;
        setSources(s);
        setPlans(p);
        setAgencies(a);
        setUsers(u);
      } catch (e) {
        console.error('useMasterData load error:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { sources, plans, agencies, users, isLoading };
}
