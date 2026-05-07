import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===============================================
// 型定義（マスタ系）
// ===============================================
export interface MUser {
  id: string;
  name: string;
  email: string;
  role: 'sales' | 'admin_staff' | 'manager';
  is_active?: boolean;
}

export interface MSource {
  code: string;
  name: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface MPlan {
  code: string;
  name: string;
  description?: string | null;
  price: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface MAgency {
  code: string;
  name: string;
  contact?: string | null;
  bank_info?: string | null;
  commission_rate?: number;
  is_active?: boolean;
  sort_order?: number;
}

// ===============================================
// 商談データ（DB の deals 行を写したフルセット）
// ===============================================
export interface DealRow {
  id: string;
  customer_name: string;
  assigned_to: string;
  deal_date: string;
  source?: string | null;
  status?: string | null;
  retirement_date?: string | null;
  agency_code?: string | null;
  memo?: string | null;
  plan_code?: string | null;
  amount?: number | null;
  payment_method?: string | null;
  payment_deadline?: string | null;
  address?: string | null;
  contract_date?: string | null;
  payment_status?: string | null;
  total_paid?: number | null;
  // 003 で追加した拡張フィールド
  phone?: string | null;
  email?: string | null;
  contract_confirmation?: string | null;
  payment_plan?: string | null;
  contract_plan?: string | null;
  contract_plan_other?: string | null;
  irregular_notes?: string | null;
  hr_proposal?: string | null;
  hr_feasibility?: string | null;
  hr_target_28m?: boolean | null;
  considering_reason?: string | null;
  considering_reason_comment?: string | null;
  out_of_scope_reason?: string | null;
  out_of_scope_reason_comment?: string | null;
  lost_reason?: string | null;
  lost_reason_comment?: string | null;
  referrer?: string | null;
  prospect_level?: string | null;
  next_action_date?: string | null;
  recording_url?: string | null;
  remarks?: string | null;
  interview_status?: string | null;
  result_status?: string | null;
  agency_type?: string | null;
  proposal_content?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DealFilters {
  status?: string;
  assigned_to?: string;
  agency_code?: string;
  source?: string;
  deal_date_from?: string;
  deal_date_to?: string;
}

export async function getDeals(filters?: DealFilters): Promise<DealRow[]> {
  try {
    let query = supabase.from('deals').select('*');

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    if (filters?.agency_code) query = query.eq('agency_code', filters.agency_code);
    if (filters?.source) query = query.eq('source', filters.source);
    if (filters?.deal_date_from) query = query.gte('deal_date', filters.deal_date_from);
    if (filters?.deal_date_to) query = query.lte('deal_date', filters.deal_date_to);

    const { data, error } = await query.order('deal_date', { ascending: false });

    if (error) {
      console.error('Error fetching deals:', error);
      return [];
    }

    return (data ?? []) as DealRow[];
  } catch (error) {
    console.error('Error in getDeals:', error);
    return [];
  }
}

export async function getDeal(id: string): Promise<DealRow | null> {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching deal:', error);
      return null;
    }

    return (data ?? null) as DealRow | null;
  } catch (error) {
    console.error('Error in getDeal:', error);
    return null;
  }
}

export async function createDeal(
  input: Partial<DealRow> & { id: string; customer_name: string; assigned_to: string; deal_date: string }
): Promise<{ data: DealRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('deals')
    .insert([input])
    .select()
    .single();
  if (error) {
    console.error('Error creating deal:', error);
    return { data: null, error: error.message };
  }
  return { data: data as DealRow, error: null };
}

export async function updateDeal(
  id: string,
  patch: Partial<DealRow>
): Promise<{ data: DealRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('deals')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Error updating deal:', error);
    return { data: null, error: error.message };
  }
  return { data: data as DealRow, error: null };
}

export async function deleteDeal(id: string): Promise<boolean> {
  const { error } = await supabase.from('deals').delete().eq('id', id);
  if (error) {
    console.error('Error deleting deal:', error);
    return false;
  }
  return true;
}

/**
 * 商談ID自動採番（D-YYYYMMDD-NNN 形式）
 * 当日の連番を取って +1。当日 0 件なら 001。
 */
export async function nextDealId(dealDate?: string): Promise<string> {
  const date = dealDate ? new Date(dealDate) : new Date();
  const yyyymmdd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const prefix = `D-${yyyymmdd}-`;
  const { data, error } = await supabase
    .from('deals')
    .select('id')
    .like('id', `${prefix}%`)
    .order('id', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) {
    return `${prefix}001`;
  }
  const lastNum = parseInt((data[0].id as string).slice(prefix.length), 10);
  if (Number.isNaN(lastNum)) return `${prefix}001`;
  return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
}

// ===============================================
// 支払いデータ（payments）
// ===============================================
export interface PaymentRow {
  id: string;
  deal_id: string;
  date: string;
  amount: number;
  method: string;
  payer_name?: string | null;
  payment_status?: string | null;
  memo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getPayments(dealId?: string): Promise<PaymentRow[]> {
  let query = supabase.from('payments').select('*');
  if (dealId) query = query.eq('deal_id', dealId);
  const { data, error } = await query.order('date', { ascending: false });
  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
  return (data ?? []) as PaymentRow[];
}

export async function createPayment(
  input: PaymentRow
): Promise<{ data: PaymentRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('payments')
    .insert([input])
    .select()
    .single();
  if (error) {
    console.error('Error creating payment:', error);
    return { data: null, error: error.message };
  }
  return { data: data as PaymentRow, error: null };
}

export async function deletePayment(id: string): Promise<boolean> {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) {
    console.error('Error deleting payment:', error);
    return false;
  }
  return true;
}

/** 支払い ID 自動採番（PAY-YYYYMMDD-NNN） */
export async function nextPaymentId(): Promise<string> {
  const d = new Date();
  const yyyymmdd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const prefix = `PAY-${yyyymmdd}-`;
  const { data } = await supabase
    .from('payments')
    .select('id')
    .like('id', `${prefix}%`)
    .order('id', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return `${prefix}001`;
  const n = parseInt((data[0].id as string).slice(prefix.length), 10);
  if (Number.isNaN(n)) return `${prefix}001`;
  return `${prefix}${String(n + 1).padStart(3, '0')}`;
}

// ===============================================
// 流入経路マスタ（m_sources）
// ===============================================
export async function getSources(activeOnly = true): Promise<MSource[]> {
  try {
    let query = supabase.from('m_sources').select('*');
    if (activeOnly) query = query.eq('is_active', true);
    // sort_order は 002 マイグレーション後にだけ存在するため、code 順でソート
    const { data, error } = await query.order('code');
    if (error) {
      console.error('Error fetching sources:', error);
      return [];
    }
    return (data ?? []) as MSource[];
  } catch (error) {
    console.error('Error in getSources:', error);
    return [];
  }
}

export async function createSource(input: MSource): Promise<{ data: MSource | null; error: string | null }> {
  const { data, error } = await supabase
    .from('m_sources')
    .insert([{ ...input, is_active: input.is_active ?? true }])
    .select()
    .single();
  if (error) {
    console.error('Error creating source:', error);
    return { data: null, error: error.message };
  }
  return { data: data as MSource, error: null };
}

export async function updateSource(
  code: string,
  patch: Partial<MSource>
): Promise<MSource | null> {
  const { data, error } = await supabase
    .from('m_sources')
    .update(patch)
    .eq('code', code)
    .select()
    .single();
  if (error) {
    console.error('Error updating source:', error);
    return null;
  }
  return data as MSource;
}

export async function deleteSource(code: string): Promise<boolean> {
  const { error } = await supabase.from('m_sources').delete().eq('code', code);
  if (error) {
    console.error('Error deleting source:', error);
    return false;
  }
  return true;
}

// ===============================================
// 成約プランマスタ（m_plans）
// ===============================================
export async function getPlans(activeOnly = true): Promise<MPlan[]> {
  try {
    let query = supabase.from('m_plans').select('*');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query.order('code');
    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
    return (data ?? []) as MPlan[];
  } catch (error) {
    console.error('Error in getPlans:', error);
    return [];
  }
}

export async function createPlan(input: MPlan): Promise<{ data: MPlan | null; error: string | null }> {
  const { data, error } = await supabase
    .from('m_plans')
    .insert([{ ...input, is_active: input.is_active ?? true }])
    .select()
    .single();
  if (error) {
    console.error('Error creating plan:', error);
    return { data: null, error: error.message };
  }
  return { data: data as MPlan, error: null };
}

export async function updatePlan(
  code: string,
  patch: Partial<MPlan>
): Promise<MPlan | null> {
  const { data, error } = await supabase
    .from('m_plans')
    .update(patch)
    .eq('code', code)
    .select()
    .single();
  if (error) {
    console.error('Error updating plan:', error);
    return null;
  }
  return data as MPlan;
}

export async function deletePlan(code: string): Promise<boolean> {
  const { error } = await supabase.from('m_plans').delete().eq('code', code);
  if (error) {
    console.error('Error deleting plan:', error);
    return false;
  }
  return true;
}

// ===============================================
// 代理店マスタ（m_agencies）
// ===============================================
export async function getAgencies(activeOnly = true): Promise<MAgency[]> {
  try {
    let query = supabase.from('m_agencies').select('*');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query.order('code');
    if (error) {
      console.error('Error fetching agencies:', error);
      return [];
    }
    return (data ?? []) as MAgency[];
  } catch (error) {
    console.error('Error in getAgencies:', error);
    return [];
  }
}

export async function createAgency(input: MAgency): Promise<{ data: MAgency | null; error: string | null }> {
  const { data, error } = await supabase
    .from('m_agencies')
    .insert([{ ...input, is_active: input.is_active ?? true }])
    .select()
    .single();
  if (error) {
    console.error('Error creating agency:', error);
    return { data: null, error: error.message };
  }
  return { data: data as MAgency, error: null };
}

export async function updateAgency(
  code: string,
  patch: Partial<MAgency>
): Promise<MAgency | null> {
  const { data, error } = await supabase
    .from('m_agencies')
    .update(patch)
    .eq('code', code)
    .select()
    .single();
  if (error) {
    console.error('Error updating agency:', error);
    return null;
  }
  return data as MAgency;
}

export async function deleteAgency(code: string): Promise<boolean> {
  const { error } = await supabase.from('m_agencies').delete().eq('code', code);
  if (error) {
    console.error('Error deleting agency:', error);
    return false;
  }
  return true;
}

// ===============================================
// 担当者マスタ（m_users）
// ===============================================
export async function getUsers(activeOnly = true): Promise<MUser[]> {
  try {
    let query = supabase.from('m_users').select('*');
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query.order('role').order('name');
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return (data ?? []) as MUser[];
  } catch (error) {
    console.error('Error in getUsers:', error);
    return [];
  }
}

export async function createUser(input: MUser): Promise<{ data: MUser | null; error: string | null }> {
  const { data, error } = await supabase
    .from('m_users')
    .insert([{ ...input, is_active: input.is_active ?? true }])
    .select()
    .single();
  if (error) {
    console.error('Error creating user:', error);
    return { data: null, error: error.message };
  }
  return { data: data as MUser, error: null };
}

export async function updateUser(
  id: string,
  patch: Partial<MUser>
): Promise<MUser | null> {
  const { data, error } = await supabase
    .from('m_users')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Error updating user:', error);
    return null;
  }
  return data as MUser;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase.from('m_users').delete().eq('id', id);
  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }
  return true;
}

// ===============================================
// 担当者ID自動採番（USRxxx 形式）
//   現在の最大 USRxxx を見て +1。空なら USR001。
// ===============================================
export async function nextUserId(): Promise<string> {
  const { data, error } = await supabase
    .from('m_users')
    .select('id')
    .like('id', 'USR%')
    .order('id', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) {
    return 'USR001';
  }
  const lastId = data[0].id as string;
  const num = parseInt(lastId.replace('USR', ''), 10);
  if (Number.isNaN(num)) return 'USR001';
  return `USR${String(num + 1).padStart(3, '0')}`;
}
