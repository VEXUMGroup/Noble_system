import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from './supabase/client';

let browserClient: SupabaseClient | null = null;

function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('supabase client is not available on the server (use server client instead)');
  }
  if (!browserClient) browserClient = createSupabaseBrowserClient();
  return browserClient;
}

export type MasterTableName =
  | 'm_users'
  | 'm_sources'
  | 'm_statuses'
  | 'm_plans'
  | 'm_agencies';

const TABLE_PRIMARY_KEY: Record<MasterTableName, string> = {
  m_users: 'id',
  m_sources: 'code',
  m_statuses: 'code',
  m_plans: 'code',
  m_agencies: 'code',
};

/** テーブル全件取得（is_active 問わず全行） */
export async function fetchMasterData(
  table: MasterTableName
): Promise<Record<string, unknown>[]> {
  const pk = TABLE_PRIMARY_KEY[table];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order(pk, { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 追加 */
export async function addMasterData(
  table: MasterTableName,
  record: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from(table).insert(record);
  if (error) throw new Error(error.message);
}

/** 更新（PK は変更不可） */
export async function updateMasterData(
  table: MasterTableName,
  key: string,
  record: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const pkField = TABLE_PRIMARY_KEY[table];
  const payload = { ...record };
  delete payload[pkField]; // PK は更新しない
  const { error } = await supabase.from(table).update(payload).eq(pkField, key);
  if (error) throw new Error(error.message);
}

/** 論理削除（is_active = false） */
export async function softDeleteMasterData(
  table: MasterTableName,
  key: string
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const pkField = TABLE_PRIMARY_KEY[table];
  const { error } = await supabase
    .from(table)
    .update({ is_active: false })
    .eq(pkField, key);
  if (error) throw new Error(error.message);
}

/** マスタ編集権限（manager のみ） */
export async function isMasterAdmin(authUserId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();

  // auth_user_id（Supabase認証ユーザーID）で検索
  // m_users.id はカスタムID（例："USR001"）で、
  // auth_user_id が Supabase auth.users.id と一致する
  const { data, error } = await supabase
    .from('m_users')
    .select('role')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    console.error('[isMasterAdmin] Error:', error.message);
    return false;
  }

  console.log('[isMasterAdmin] Found user role:', data?.role);
  return data?.role === 'manager';
}
