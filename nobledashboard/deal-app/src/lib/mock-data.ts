import { DealStatus } from './types';

export interface User {
  id: string;
  name: string;
  role: 'sales' | 'admin_staff' | 'manager';
  email: string;
}

export interface Deal {
  id: string;
  customer_name: string;
  assigned_to: string;
  deal_date: string;
  source: string;
  status: DealStatus;
  retirement_date: string; // noble.md要件：自由記入（「未定」「2026年6月頃」なども可）
  agency_code?: string;
  memo?: string;
  plan_code?: string;
  amount?: number;
  payment_method?: string;
  payment_deadline?: string;
  address?: string;
  contract_date?: string;
  payment_status?: string;
  total_paid?: number;
  created_at: string;
  updated_at: string;
  // ワイヤーフレーム追加フィールド
  interview_status?: string; // 面談ステータス
  result_status?: string; // 結果ステータス（成約/検討/失注/対象外）
  prospect_level?: string; // 見込み顧客
  referrer?: string; // 紹介者（代理店経由）
  agency_type?: string; // 代理店新旧
  next_action_date?: string; // 次回アクション日
  recording_url?: string; // レコ（動画）URL
  hr_proposal?: string; // 人材提案（対象/対象外）
  hr_feasibility?: string; // 人材可否（可/否/保留）
  hr_target_28m?: boolean; // 人材提案 28ヶ月対象フラグ
  hr_reason?: string; // 可否理由
  remarks?: string; // 備考欄
  payment_plan?: string; // 支払いプラン（一括/分割/完全成功）
  proposal_content?: string; // 提案内容
  contract_confirmation?: string; // 契約書締結確認
  // 理由記載欄（結果ステータスに応じて出し分け）
  considering_reason?: string; // 検討理由（プルダウン）
  considering_reason_comment?: string; // 検討理由コメント
  out_of_scope_reason?: string; // 対象外理由（プルダウン）
  out_of_scope_reason_comment?: string; // 対象外理由コメント
  lost_reason?: string; // 失注理由（プルダウン）
  lost_reason_comment?: string; // 失注理由コメント
}

export interface PaymentRecord {
  id: string;
  deal_id: string;
  date: string;
  amount: number;
  method: string;
  memo?: string;
  payer_name?: string;
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

export interface Notification {
  id: string;
  user_id: string;
  deal_id?: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ========== Mock Data ==========

export const currentUser: User = {
  id: 'USR001',
  name: '市岡',
  role: 'sales',
  email: 'ichioka@example.com',
};

export const mockUsers: User[] = [
  { id: 'USR001', name: '市岡', role: 'sales', email: 'ichioka@example.com' },
  { id: 'USR002', name: '田中', role: 'admin_staff', email: 'tanaka@example.com' },
  { id: 'USR003', name: '管理者', role: 'manager', email: 'admin@example.com' },
];

export const mockPlans: Plan[] = [
  { code: 'PLAN_10M', name: '10ヶ月プラン', description: '10ヶ月サポートプラン', price: 330000 },
  { code: 'PLAN_28M', name: '28ヶ月プラン', description: '28ヶ月一括サポートプラン', price: 550000 },
  { code: 'PLAN_28M_SPLIT', name: '28ヶ月分割プラン', description: '28ヶ月分割払いプラン', price: 660000 },
];

export const mockSources: Source[] = [
  { code: 'WEB', name: 'WEB' },
  { code: 'REFERRAL', name: '紹介' },
  { code: 'PHONE', name: '電話' },
  { code: 'LINE', name: 'LINE' },
  { code: 'META', name: 'WEBシーズ_Meta' },
  { code: 'GOOGLE', name: 'Googleリスティング' },
  { code: 'TIKTOK', name: 'TikTok' },
];

export const mockAgencies: Agency[] = [
  { code: 'AG001', name: '代理店A', contact: '光本翔平' },
  { code: 'AG002', name: '代理店B', contact: '高山優希' },
];

// 面談ステータス選択肢
export const interviewStatuses = ['面談実施', '面談【飛び】', '面談【キャンセル】', '再面談予定'];

// 結果ステータス選択肢（noble.md: 成約/検討/失注/対象外）
export const resultStatuses = ['成約', '検討', '失注', '対象外'];

// 見込み顧客選択肢
export const prospectLevels = ['見込みあり', '見込み低', '新規', '再商談'];

// 代理店新旧選択肢
export const agencyTypes = ['新規', '既存'];

// 人材提案選択肢
export const hrProposalOptions = ['対象', '対象外'];

// 人材可否選択肢（noble.md要件：対象・対象外＋可否）
export const hrFeasibilityOptions = ['可', '否', '保留'];

// 支払いプラン選択肢（noble.md: 一括/分割/完全成功）
export const paymentPlanOptions = ['一括', '分割', '完全成功'];

// 支払い方法選択肢（noble.md: 銀行振込/カード）
export const paymentMethodOptions = [
  { value: 'transfer', label: '銀行振込' },
  { value: 'card', label: 'カード' },
];

// 契約書締結確認選択肢
export const contractConfirmationOptions = ['未送付', '送付済', '回収待ち', '完了'];

// 成約プラン選択肢（noble.md: 10/12/18/28/30ヶ月＋その他）
export const contractPlanOptions = [
  '10ヶ月',
  '12ヶ月',
  '18ヶ月',
  '28ヶ月',
  '30ヶ月',
  'その他',
];

// 検討理由選択肢（マスタ候補）
export const consideringReasons = [
  '時期が合わない',
  '料金が合わない',
  '家族に相談',
  '他社と比較検討',
  '情報不足',
  'その他',
];

// 対象外理由選択肢（マスタ候補）
export const outOfScopeReasons = [
  '年齢対象外',
  '時期対象外',
  '雇用形態対象外',
  'エリア対象外',
  '条件不一致',
  'その他',
];

// 失注理由選択肢（マスタ候補）
export const lostReasons = [
  '他社決定',
  '予算不足',
  '連絡取れず',
  '本人意思変更',
  'タイミング逸失',
  'その他',
];

export const mockDeals: Deal[] = [
  {
    id: 'D-20260401-001',
    customer_name: '山田太郎',
    assigned_to: 'USR001',
    deal_date: '2026-04-01',
    source: 'META',
    status: 'NEW',
    retirement_date: '2026-06-30',
    memo: 'Googleカレンダーから自動取得',
    interview_status: '面談実施',
    prospect_level: '見込みあり',
    agency_type: '新規',
    referrer: '代理店A',
    agency_code: 'AG001',
    created_at: '2026-04-01T09:00:00Z',
    updated_at: '2026-04-01T09:00:00Z',
  },
  {
    id: 'D-20260405-001',
    customer_name: '鈴木花子',
    assigned_to: 'USR001',
    deal_date: '2026-04-05',
    source: 'REFERRAL',
    status: 'INTERVIEWED',
    retirement_date: '2026-05-15',
    agency_code: 'AG001',
    memo: '面談完了。成約の見込みあり',
    interview_status: '面談実施',
    result_status: '検討',
    prospect_level: '見込みあり',
    referrer: '代理店A',
    agency_type: '新規',
    next_action_date: '2026-04-20',
    created_at: '2026-04-05T10:30:00Z',
    updated_at: '2026-04-10T14:00:00Z',
  },
  {
    id: 'D-20260310-001',
    customer_name: '佐藤次郎',
    assigned_to: 'USR001',
    deal_date: '2026-03-10',
    source: 'LINE',
    status: 'CONSIDERING',
    retirement_date: '2026-04-28',
    memo: '検討中。退職日が近い',
    interview_status: '面談実施',
    result_status: '検討',
    prospect_level: '見込みあり',
    next_action_date: '2026-04-18',
    created_at: '2026-03-10T11:00:00Z',
    updated_at: '2026-04-08T16:00:00Z',
  },
  {
    id: 'D-20260320-001',
    customer_name: '伊藤美咲',
    assigned_to: 'USR001',
    deal_date: '2026-03-20',
    source: 'PHONE',
    status: 'CONTRACTED',
    retirement_date: '2026-06-10',
    memo: '成約済み。詳細入力待ち',
    interview_status: '面談実施',
    result_status: '成約',
    prospect_level: '見込みあり',
    created_at: '2026-03-20T08:30:00Z',
    updated_at: '2026-04-14T10:00:00Z',
  },
  {
    id: 'D-20260301-001',
    customer_name: '渡辺由美',
    assigned_to: 'USR001',
    deal_date: '2026-03-01',
    source: 'REFERRAL',
    status: 'DETAIL_ENTERED',
    retirement_date: '2026-05-30',
    plan_code: 'PLAN_28M',
    amount: 550000,
    payment_method: 'stripe',
    payment_deadline: '2026-06-30',
    agency_code: 'AG002',
    memo: '詳細入力完了。事務承認待ち',
    interview_status: '面談実施',
    result_status: '成約',
    prospect_level: '見込みあり',
    referrer: '代理店B',
    agency_type: '既存',
    payment_plan: '3回払い',
    proposal_content: '雇用保険＋傷病手当金サポート',
    created_at: '2026-03-01T13:00:00Z',
    updated_at: '2026-04-13T09:00:00Z',
  },
  {
    id: 'D-20260215-001',
    customer_name: '中村健一',
    assigned_to: 'USR001',
    deal_date: '2026-02-15',
    source: 'WEB',
    status: 'APPROVED',
    retirement_date: '2026-05-20',
    plan_code: 'PLAN_28M_SPLIT',
    amount: 660000,
    payment_method: 'transfer',
    payment_deadline: '2026-06-20',
    memo: '事務承認済み。締結情報の入力待ち',
    interview_status: '面談実施',
    result_status: '成約',
    prospect_level: '見込みあり',
    agency_type: '新規',
    payment_plan: '4回払い',
    proposal_content: '雇用保険サポート',
    created_at: '2026-02-15T15:30:00Z',
    updated_at: '2026-04-11T11:30:00Z',
  },
  {
    id: 'D-20260201-001',
    customer_name: '高橋裕子',
    assigned_to: 'USR001',
    deal_date: '2026-02-01',
    source: 'REFERRAL',
    status: 'CONTRACT_SIGNED',
    retirement_date: '2026-05-10',
    plan_code: 'PLAN_10M',
    amount: 330000,
    payment_method: 'stripe',
    payment_deadline: '2026-06-10',
    agency_code: 'AG001',
    memo: '締結済み。支払管理開始待ち',
    address: '東京都新宿区西新宿2-8-1',
    contract_date: '2026-04-09',
    interview_status: '面談実施',
    result_status: '成約',
    referrer: '代理店A',
    agency_type: '新規',
    payment_plan: '一括',
    contract_confirmation: '完了',
    created_at: '2026-02-01T09:15:00Z',
    updated_at: '2026-04-12T13:45:00Z',
  },
  {
    id: 'D-20260115-001',
    customer_name: '川端真理',
    assigned_to: 'USR001',
    deal_date: '2026-01-15',
    source: 'LINE',
    status: 'CONTRACT_SIGNED',
    retirement_date: '2026-04-30',
    plan_code: 'PLAN_28M_SPLIT',
    amount: 660000,
    payment_method: 'transfer',
    payment_deadline: '2026-05-31',
    address: '福岡県福岡市博多区1-2-3',
    contract_date: '2026-04-01',
    memo: '締結済み。支払管理へ移行',
    interview_status: '面談実施',
    result_status: '成約',
    payment_plan: '3回払い',
    contract_confirmation: '完了',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-04-14T14:00:00Z',
  },
  {
    id: 'D-20251201-001',
    customer_name: '栗本浩二',
    assigned_to: 'USR001',
    deal_date: '2025-12-01',
    source: 'WEB',
    status: 'PAYMENT_MANAGING',
    retirement_date: '2026-03-31',
    plan_code: 'PLAN_28M',
    amount: 550000,
    payment_method: 'transfer',
    payment_deadline: '2026-04-30',
    address: '東京都渋谷区道玄坂1-1-1',
    contract_date: '2026-03-15',
    payment_status: '入金中',
    total_paid: 275000,
    memo: '支払管理中。50%入金済み',
    interview_status: '面談実施',
    result_status: '成約',
    payment_plan: '3回払い',
    contract_confirmation: '完了',
    agency_code: 'AG001',
    referrer: '代理店A',
    agency_type: '既存',
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2026-04-10T10:00:00Z',
  },
  {
    id: 'D-20251101-001',
    customer_name: '西山太一',
    assigned_to: 'USR001',
    deal_date: '2025-11-01',
    source: 'REFERRAL',
    status: 'COMPLETED',
    retirement_date: '2026-01-31',
    plan_code: 'PLAN_10M',
    amount: 330000,
    payment_method: 'stripe',
    payment_deadline: '2026-02-28',
    address: '大阪府大阪市北区梅田2-3-4',
    contract_date: '2026-01-10',
    payment_status: '完了',
    total_paid: 330000,
    memo: '全額入金完了',
    interview_status: '面談実施',
    result_status: '成約',
    payment_plan: '一括',
    contract_confirmation: '完了',
    created_at: '2025-11-01T09:00:00Z',
    updated_at: '2026-03-20T16:00:00Z',
  },
];

// 入金履歴モックデータ
export const mockPaymentRecords: PaymentRecord[] = [
  {
    id: 'PAY001',
    deal_id: 'D-20251201-001',
    date: '2026-03-20',
    amount: 183333,
    method: '振り込み確認',
    memo: '1回目/3回 振り込み確認済み',
  },
  {
    id: 'PAY002',
    deal_id: 'D-20251201-001',
    date: '2026-04-10',
    amount: 91667,
    method: '振り込み確認',
    memo: '2回目/3回 一部入金',
  },
  {
    id: 'PAY003',
    deal_id: 'D-20251101-001',
    date: '2026-01-15',
    amount: 330000,
    method: 'Stripe自動決済',
    memo: '一括決済完了',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'N001',
    user_id: 'USR001',
    deal_id: 'D-20260310-001',
    type: 'retirement_alert',
    message: '佐藤次郎様の退職予定日が14日以内です。成約確認を行いましょう。',
    is_read: false,
    created_at: '2026-04-16T00:00:00Z',
  },
  {
    id: 'N002',
    user_id: 'USR002',
    deal_id: 'D-20260301-001',
    type: 'approval_request',
    message: '渡辺由美様の成約詳細情報が入力されました。承認をお願いします。',
    is_read: false,
    created_at: '2026-04-13T09:00:00Z',
  },
  {
    id: 'N003',
    user_id: 'USR001',
    deal_id: 'D-20260115-001',
    type: 'contract_complete',
    message: '川端真理様の契約が締結されました。',
    is_read: true,
    created_at: '2026-04-01T10:00:00Z',
  },
  {
    id: 'N004',
    user_id: 'USR001',
    deal_id: 'D-20251201-001',
    type: 'payment_reminder',
    message: '栗本浩二様の支払期日が3日後（2026/04/30）です。',
    is_read: false,
    created_at: '2026-04-16T00:00:00Z',
  },
];

// Helper functions
export function getUserName(userId: string): string {
  return mockUsers.find((u) => u.id === userId)?.name ?? userId;
}

export function getPlanName(planCode?: string): string {
  if (!planCode) return '-';
  return mockPlans.find((p) => p.code === planCode)?.name ?? planCode;
}

export function getAgencyName(agencyCode?: string): string {
  if (!agencyCode) return '-';
  return mockAgencies.find((a) => a.code === agencyCode)?.name ?? agencyCode;
}

export function getSourceName(sourceCode: string): string {
  return mockSources.find((s) => s.code === sourceCode)?.name ?? sourceCode;
}

export function formatCurrency(amount?: number): string {
  if (amount == null) return '-';
  return `¥${amount.toLocaleString()}`;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPaymentRecords(dealId: string): PaymentRecord[] {
  return mockPaymentRecords.filter((r) => r.deal_id === dealId);
}
