import type { DealStatus } from './types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'sales' | 'admin_staff' | 'manager';
}

export interface Plan {
  code: string;
  name: string;
  description: string;
  price: number;
}

export interface Source {
  code: string;
  name: string;
}

export interface Agency {
  code: string;
  name: string;
  contact?: string;
}

export interface PaymentRecord {
  id: string;
  deal_id: string;
  date: string;
  amount: number;
  method: string;
  payer_name?: string;
  payment_status?: string;
  memo?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'retirement_alert' | 'contract_complete';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface Deal {
  id: string;
  customer_name: string;
  status: DealStatus;
  assigned_to: string;
  deal_date: string;
  retirement_date: string;
  updated_at: string;
  source?: string;
  source_code?: string;
  agency_code?: string;
  plan_code?: string;
  amount?: number;
  memo?: string;
  address?: string;
  phone?: string;
  email?: string;
  contract_date?: string;
  contract_confirmation?: string;
  payment_method?: 'stripe' | 'transfer' | 'card' | string;
  payment_plan?: string;
  payment_deadline?: string;
  total_paid?: number;
  // 成約詳細拡張フィールド
  contract_plan?: string;
  contract_plan_other?: string;
  irregular_notes?: string;
  hr_proposal?: string;
  hr_feasibility?: string;
  hr_target_28m?: boolean;
  considering_reason?: string;
  considering_reason_comment?: string;
  out_of_scope_reason?: string;
  out_of_scope_reason_comment?: string;
  lost_reason?: string;
  lost_reason_comment?: string;
  referrer?: string;
  prospect_level?: string;
  next_action_date?: string;
  recording_url?: string;
  remarks?: string;
  // 新規商談・商談詳細拡張フィールド
  interview_status?: string;
  result_status?: string;
  agency_type?: string;
  proposal_content?: string;
  created_at?: string;
}

export const currentUser: User = {
  id: 'u001',
  name: '山田 太郎',
  email: 'yamada@example.com',
  role: 'manager',
};

export const mockUsers: User[] = [
  currentUser,
  { id: 'u002', name: '佐藤 花子', email: 'sato@example.com', role: 'sales' },
  { id: 'u003', name: '鈴木 一郎', email: 'suzuki@example.com', role: 'admin_staff' },
];

export const mockPlans: Plan[] = [
  { code: 'PLAN-A', name: '標準プラン', description: '標準サポート', price: 330000 },
  { code: 'PLAN-B', name: '分割プラン', description: '分割払い対応', price: 440000 },
];

export const mockSources: Source[] = [
  { code: 'WEB', name: 'Web問い合わせ' },
  { code: 'REF', name: '紹介' },
  { code: 'ADS', name: '広告' },
];

export const mockAgencies: Agency[] = [
  { code: 'AG001', name: '東京紹介パートナー', contact: 'tanaka@example.com' },
  { code: 'AG002', name: '大阪支援センター', contact: 'osaka@example.com' },
];

export const mockDeals: Deal[] = [
  {
    id: 'D-20260401-001',
    customer_name: '田中 健一',
    status: 'CONSIDERING',
    assigned_to: 'u002',
    deal_date: '2026-04-01',
    retirement_date: '2026-04-30',
    updated_at: '2026-04-16T09:30:00+09:00',
    source: 'WEB',
    source_code: 'WEB',
    agency_code: 'AG001',
    plan_code: 'PLAN-A',
    amount: 330000,
    payment_method: 'transfer',
    payment_plan: '一括',
    payment_deadline: '2026-05-10',
    total_paid: 0,
    memo: '退職予定日が近いためフォロー優先。',
    address: '東京都千代田区1-1-1',
    phone: '090-0000-0001',
    email: 'tanaka@example.com',
  },
  {
    id: 'D-20260403-002',
    customer_name: '鈴木 美咲',
    status: 'PAYMENT_MANAGING',
    assigned_to: 'u001',
    deal_date: '2026-04-03',
    retirement_date: '2026-05-20',
    updated_at: '2026-04-15T14:10:00+09:00',
    source: 'REF',
    source_code: 'REF',
    agency_code: 'AG002',
    plan_code: 'PLAN-B',
    amount: 440000,
    contract_date: '2026-04-12',
    contract_confirmation: 'COMPLETED',
    payment_method: 'stripe',
    payment_plan: '4回払い',
    payment_deadline: '2026-05-15',
    total_paid: 110000,
    memo: '初回入金済み。次回入金待ち。',
    address: '大阪府大阪市北区2-2-2',
    phone: '090-0000-0002',
    email: 'suzuki@example.com',
  },
  {
    id: 'D-20260405-003',
    customer_name: '高橋 誠',
    status: 'CONTRACT_SIGNED',
    assigned_to: 'u003',
    deal_date: '2026-04-05',
    retirement_date: '2026-06-01',
    updated_at: '2026-04-14T18:20:00+09:00',
    source: 'ADS',
    source_code: 'ADS',
    agency_code: 'AG001',
    plan_code: 'PLAN-A',
    amount: 330000,
    contract_date: '2026-04-13',
    contract_confirmation: 'COMPLETED',
    payment_method: 'transfer',
    payment_plan: '3回払い',
    payment_deadline: '2026-05-01',
    total_paid: 0,
    memo: '契約締結済み。支払い案内済み。',
    address: '神奈川県横浜市西区3-3-3',
    phone: '090-0000-0003',
    email: 'takahashi@example.com',
  },
  {
    id: 'D-20260430-005',
    customer_name: '山本 さくら',
    status: 'NEW',
    assigned_to: 'u002',
    deal_date: '2026-04-30',
    retirement_date: '2026-06-30',
    updated_at: '2026-04-30T10:00:00+09:00',
    source: 'REF',
    source_code: 'REF',
    agency_code: 'AG002',
    memo: '紹介経由。退職後の転職支援希望。',
    address: '埼玉県さいたま市大宮区4-4-4',
    phone: '090-0000-0005',
    email: 'yamamoto.sakura@example.com',
  },
];

export const mockPaymentRecords: PaymentRecord[] = [
  {
    id: 'PAY001',
    deal_id: 'D-20260403-002',
    date: '2026-04-15',
    amount: 110000,
    method: 'Stripe自動決済',
    payer_name: '鈴木 美咲',
    payment_status: '入金完了（今回分）',
    memo: '1回目/4回 入金確認済み',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n001',
    type: 'retirement_alert',
    title: '退職日アラート',
    message: '田中 健一さんの退職予定日が近づいています。',
    created_at: '2026-04-16T09:00:00+09:00',
    is_read: false,
  },
  {
    id: 'n002',
    type: 'contract_complete',
    title: '契約締結',
    message: '高橋 誠さんの契約締結が完了しました。',
    created_at: '2026-04-15T16:30:00+09:00',
    is_read: true,
  },
];

export const interviewStatuses = ['面談実施', '面談キャンセル', '再面談予定'];
export const resultStatuses = ['成約', '検討', '失注', '対象外'];
export const prospectLevels = ['A', 'B', 'C'];
export const agencyTypes = ['紹介代理店', '広告', '自社'];
export const hrProposalOptions = ['提案済み', '未提案', '不要'];
export const hrFeasibilityOptions = ['可能', '要確認', '不可'];
export const consideringReasons = ['費用検討', '家族相談', '時期調整'];
export const outOfScopeReasons = ['条件不一致', '対象外職種', 'その他'];
export const lostReasons = ['他社決定', '連絡不可', '予算不一致'];

// 成約詳細入力オプション
export const contractPlanOptions = ['10ヶ月', '12ヶ月', '18ヶ月', '24ヶ月', '28ヶ月', '30ヶ月', 'その他'];
export const paymentPlanOptions = ['一括', '分割', '完全成功'];
export const paymentMethodOptions = [
  { value: 'transfer', label: '銀行振込' },
  { value: 'card', label: 'クレジットカード' },
  { value: 'stripe', label: 'Stripe自動決済' },
];

export function getUserName(userId?: string): string {
  return mockUsers.find((u) => u.id === userId)?.name ?? userId ?? '-';
}

export function getPlanName(code?: string): string {
  return mockPlans.find((p) => p.code === code)?.name ?? code ?? '-';
}

export function getAgencyName(code?: string): string {
  return mockAgencies.find((a) => a.code === code)?.name ?? code ?? '-';
}

export function getSourceName(code?: string): string {
  return mockSources.find((s) => s.code === code)?.name ?? code ?? '-';
}

export function formatCurrency(amount?: number): string {
  return typeof amount === 'number' ? amount.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }) : '-';
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('ja-JP');
}

export function getDaysUntil(dateStr?: string): number {
  if (!dateStr) return 0;
  const today = new Date('2026-04-16T00:00:00+09:00');
  const target = new Date(`${dateStr}T00:00:00+09:00`);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
