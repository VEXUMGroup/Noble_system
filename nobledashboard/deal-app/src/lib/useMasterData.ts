'use client';

import { useEffect, useState } from 'react';
import {
  type MUser,
  type MSource,
  type MPlan,
  type MAgency,
  type MStatus,
  getSources,
  getPlans,
  getAgencies,
  getUsers,
  getStatuses,
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
  const [statuses, setStatuses] = useState<MStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/master-data', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`master-data fetch failed: ${response.status}`);
        }
        const json = (await response.json().catch(() => null)) as
          | {
              users?: MUser[];
              sources?: MSource[];
              plans?: MPlan[];
              agencies?: MAgency[];
              statuses?: MStatus[];
            }
          | null;

        const s = json?.sources ?? (await getSources(true));
        const p = json?.plans ?? (await getPlans(true));
        const a = json?.agencies ?? (await getAgencies(true));
        const u = json?.users ?? (await getUsers(true));
        const st = json?.statuses ?? (await getStatuses(true));

        if (cancelled) return;
        setSources(s);
        setPlans(p);
        setAgencies(a);
        setUsers(u);
        setStatuses(st);
      } catch (e) {
        console.error('useMasterData load error:', e);
        try {
          const [s, p, a, u, st] = await Promise.all([
            getSources(true),
            getPlans(true),
            getAgencies(true),
            getUsers(true),
            getStatuses(true),
          ]);
          if (cancelled) return;
          setSources(s);
          setPlans(p);
          setAgencies(a);
          setUsers(u);
          setStatuses(st);
        } catch (fallbackError) {
          console.error('useMasterData fallback load error:', fallbackError);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { sources, plans, agencies, users, statuses, isLoading };
}
