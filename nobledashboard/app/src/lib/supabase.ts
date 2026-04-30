import { createClient } from '@supabase/supabase-js';
import type { Deal } from './mock-data';
import type { StatusHistory, ResultStatus } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DealFilters {
  status?: string;
  assigned_to?: string;
}

// ========== 読み取り ==========

export async function getDeals(filters?: DealFilters) {
  try {
    let query = supabase.from('deals').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching deals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDeals:', error);
    return [];
  }
}

export async function getDeal(id: string): Promise<Deal | null> {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching deal:', error);
      return null;
    }

    // 履歴もセットで返す
    const history = await getDealHistory(id);
    return { ...(data as Deal), status_history: history };
  } catch (error) {
    console.error('Error in getDeal:', error);
    return null;
  }
}

export async function getDealHistory(dealId: string): Promise<StatusHistory[]> {
  try {
    const { data, error } = await supabase
      .from('deal_status_history')
      .select('*')
      .eq('deal_id', dealId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching deal history:', error);
      return [];
    }
    return (data as StatusHistory[]) || [];
  } catch (error) {
    console.error('Error in getDealHistory:', error);
    return [];
  }
}

// ========== 書き込み ==========

/**
 * dealsテーブルの任意列を一括更新する。
 * 呼び出し側は「変更後の値だけ」を渡せばOK。
 * status_history は別テーブルなので渡さない想定。
 */
export async function updateDeal(
  id: string,
  patch: Partial<Deal>,
  updatedBy: string
): Promise<Deal | null> {
  try {
    // status_history は別テーブル管理なので除外
    const { status_history, created_at, updated_at, ...rest } = patch as Partial<Deal> & {
      status_history?: unknown;
      created_at?: unknown;
      updated_at?: unknown;
    };
    void status_history;
    void created_at;
    void updated_at;

    const payload = {
      ...rest,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    };

    const { data, error } = await supabase
      .from('deals')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      return null;
    }
    return data as Deal;
  } catch (error) {
    console.error('Error in updateDeal:', error);
    return null;
  }
}

/**
 * 結果ステータス変更を1トランザクションで扱うヘルパ。
 * - deals.result_status を更新
 * - OUT_OF_SCOPE なら out_of_scope_reason も保存
 * - deal_status_history に STATUS_CHANGE を追記
 */
export async function updateDealResultStatus(params: {
  dealId: string;
  oldStatus?: ResultStatus;
  newStatus: ResultStatus;
  newStatusLabel: string;
  outOfScopeReason?: string;
  userId: string;
  userName: string;
}): Promise<{ deal: Deal | null; history: StatusHistory | null }> {
  const now = new Date().toISOString();
  const patch: Partial<Deal> = { result_status: params.newStatus };
  if (params.newStatus === 'OUT_OF_SCOPE') {
    (patch as Record<string, unknown>).out_of_scope_reason = params.outOfScopeReason ?? '';
  }

  const deal = await updateDeal(params.dealId, patch, params.userId);
  if (!deal) return { deal: null, history: null };

  const historyRow: StatusHistory = {
    id: `SH-${params.dealId}-${Date.now()}-result`,
    deal_id: params.dealId,
    timestamp: now,
    user_id: params.userId,
    user_name: params.userName,
    action_type: 'STATUS_CHANGE',
    old_status: params.oldStatus,
    new_status: params.newStatus,
    status_label: params.newStatusLabel,
    memo: params.newStatus === 'OUT_OF_SCOPE' ? params.outOfScopeReason : undefined,
  };
  const history = await addStatusHistory(historyRow);
  return { deal, history };
}

/**
 * 履歴1件を追加する。
 */
export async function addStatusHistory(
  entry: StatusHistory
): Promise<StatusHistory | null> {
  try {
    const { data, error } = await supabase
      .from('deal_status_history')
      .insert(entry)
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting status history:', error);
      return null;
    }
    return data as StatusHistory;
  } catch (error) {
    console.error('Error in addStatusHistory:', error);
    return null;
  }
}

/**
 * 複数履歴を一括追加する (FIELD_EDITの差分履歴など)。
 */
export async function addStatusHistoryBatch(
  entries: StatusHistory[]
): Promise<StatusHistory[]> {
  if (entries.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('deal_status_history')
      .insert(entries)
      .select('*');

    if (error) {
      console.error('Error inserting status history batch:', error);
      return [];
    }
    return (data as StatusHistory[]) || [];
  } catch (error) {
    console.error('Error in addStatusHistoryBatch:', error);
    return [];
  }
}
