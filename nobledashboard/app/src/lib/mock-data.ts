import { DealStatus, InterviewStatus, ResultStatus, ContractConfirmStatus, ContractStatus, SupportStatus, PaymentStatus, type StatusHistory } from './types';

// ========== Interfaces ==========

export interface User {
  id: string;
  name: string;
  role: 'sales' | 'admin_staff' | 'manager';
  email: string;
}

// 商談管理テーブル
export interface Deal {
  id: string;
  assigned_to: string;
  deal_month: string;          // YYYY/MM
  deal_date: string;
  customer_name: string;
  prospect_level?: string;     // 見込みあり / 見込み低 / 新規 / 再商談
  source: string;              // 流入経路（エルステ経由）
  referrer?: string;           // 紹介者（代理店経由）
  agency_type?: string;        // 新規 / 既存
  interview_status: InterviewStatus;
  result_status?: ResultStatus;
  contract_confirm?: ContractConfirmStatus;
  contract_date?: string;
  proposal_content?: string;   // 提案内容
  amount?: number;             // 成約金額
  retirement_date: string;     // 退職日
  next_action_date?: string;   // 次回アクション日
  deal_notes?: string;         // 商談内容メモ
  recording_url?: string;      // レコ（動画）
  hr_proposal?: string;        // 人材提案: 対象 / 対象外
  hr_feasibility?: string;     // 人材可否: 可 / 否 / 判定前
  hr_reason?: string;          // 可否理由
  remarks?: string;            // 備考欄
  status_history?: StatusHistory[];  // ステータス変更履歴・メモ（時系列）
  // 旧互換
  status: DealStatus;
  created_at: string;
  updated_at: string;
}

// 顧客管理テーブル
export interface Customer {
  customer_id: string;         // 顧客番号 (例: 2311_001)
  deal_id?: string;            // 紐づく商談ID
  sim_number?: string;         // SIM番号
  contract_month: string;      // 成約月
  deal_date: string;           // 商談日
  assigned_to: string;         // 担当者
  customer_name: string;       // 顧客名
  furigana: string;            // フリガナ
  payment_name?: string;       // 支払い名義
  phone: string;               // 電話番号
  email?: string;              // メールアドレス
  address?: string;            // 住所
  retirement_date?: string;    // 退職日
  contract_plan: string;       // 成約プラン
  payment_plan: string;        // 支払いプラン: 一括 / 分割
  payment_method: string;      // 支払い方法: 振込 / カード
  contract_amount: number;     // 成約金額
  payment_count?: number;      // 支払い回数
  payment_notes?: string;      // 支払いメモ
  contract_status: ContractStatus;
  support_status: SupportStatus;
  customer_notes?: string;     // 顧客メモ
  contract_signed: boolean;    // 契約書締結確認
  contract_date?: string;      // 締結日
  payment_guide_sent: boolean; // 入金案内
  first_payment_due?: string;  // 初回入金期日
  orientation_date?: string;   // オリエン日程
  pre_survey_sent: boolean;    // 事前アンケ送付
  total_paid: number;          // 入金済み金額
  payment_status: PaymentStatus;
  subsequent_pay_due?: string; // 2回目以降入金期日
  source?: string;             // 流入経路
  referrer_1?: string;         // 紹介者①
  referral_fee_1?: number;     // 紹介料①
  referrer_2?: string;         // 紹介者②
  referral_fee_2?: number;     // 紹介料②
  created_at: string;
  updated_at: string;
}

// 入金管理テーブル
export interface Payment {
  id: number;
  customer_id: string;         // 顧客番号
  payment_status: PaymentStatus;
  contract_status: ContractStatus;
  support_status: SupportStatus;
  payment_name?: string;       // 支払い名義
  payment_plan: string;        // 一括 / 分割
  payment_method: string;      // 振込 / カード
  payment_count?: number;      // 支払い予定回数
  paid_count?: number;         // 支払い済回数
  payment_notes?: string;      // 支払いメモ
  unpaid_amount?: number;      // 未払い金額
  paid_amount?: number;        // 支払い済金額
  first_payment_notified: boolean;
  installment_notice_status?: string; // 案内終了 / 未案内 / 対応中
  payment_due_date?: string;   // 入金期日
  installment_schedule?: string; // 分割入金時期目安
  next_billing_addition?: number; // 次回請求加算額
  total_late_fee?: number;     // 遅延損害金合計
  cancellation_fee?: number;   // キャンセル料
  refund_amount?: number;      // 返金額
  created_at: string;
  updated_at: string;
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
  customer_id?: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ========== Mock Master Data ==========

export const currentUser: User = {
  id: 'USR001',
  name: '市岡',
  role: 'sales',
  email: 'ichioka@example.com',
};

export const mockUsers: User[] = [
  { id: 'USR001', name: '市岡', role: 'sales', email: 'ichioka@example.com' },
  { id: 'USR002', name: '田中', role: 'admin_staff', email: 'tanaka@example.com' },
  { id: 'USR003', name: '青木', role: 'sales', email: 'aoki@example.com' },
  { id: 'USR004', name: '西山', role: 'manager', email: 'nishiyama@example.com' },
];

export const mockPlans: Plan[] = [
  { code: 'PLAN_10M', name: '10ヶ月プラン', description: '10ヶ月サポートプラン', price: 330000 },
  { code: 'PLAN_28M', name: '28ヶ月プラン', description: '28ヶ月一括サポートプラン', price: 550000 },
  { code: 'PLAN_28M_SPLIT', name: '28ヶ月分割プラン', description: '28ヶ月分割払いプラン', price: 660000 },
];

export const mockSources: Source[] = [
  { code: 'WEB_META', name: 'WEBシーズ_Meta' },
  { code: 'GOOGLE_ADS', name: 'Googleリスティング' },
  { code: 'TIKTOK', name: 'TikTok' },
  { code: 'DIRECT_LINE', name: '直LINE' },
  { code: 'REFERRAL', name: '紹介' },
  { code: 'PHONE', name: '電話' },
];

export const mockAgencies: Agency[] = [
  { code: 'AG001', name: '代理店A', contact: '浦川聖哉' },
  { code: 'AG002', name: '代理店B', contact: '高山優希' },
];

// ========== Mock 商談データ ==========

export const mockDeals: Deal[] = [
  {
    id: 'D-20260401-001',
    assigned_to: 'USR001',
    deal_month: '2026/04',
    deal_date: '2026-04-01',
    customer_name: '山田太郎',
    prospect_level: '見込みあり',
    source: 'WEB_META',
    interview_status: 'INTERVIEW_DONE',
    result_status: undefined,
    retirement_date: '2026-06-30',
    next_action_date: '2026-04-20',
    deal_notes: 'Googleカレンダーから自動取得。初回面談完了',
    hr_proposal: '対象外',
    status_history: [
      {
        id: 'SH-001-01',
        deal_id: 'D-20260401-001',
        timestamp: '2026-04-01T09:00:00Z',
        user_id: 'SYSTEM',
        user_name: 'システム',
        action_type: 'STATUS_CHANGE',
        new_status: 'NEW',
        status_label: '新規',
        source: 'Googleカレンダーから自動取得',
      },
      {
        id: 'SH-001-02',
        deal_id: 'D-20260401-001',
        timestamp: '2026-04-04T14:30:45Z',
        user_id: 'USR001',
        user_name: '市岡',
        action_type: 'STATUS_CHANGE',
        old_status: 'NEW',
        new_status: 'INTERVIEWED',
        status_label: '面談済',
      },
    ],
    status: 'INTERVIEWED',
    created_at: '2026-04-01T09:00:00Z',
    updated_at: '2026-04-01T09:00:00Z',
  },
  {
    id: 'D-20260405-001',
    assigned_to: 'USR001',
    deal_month: '2026/04',
    deal_date: '2026-04-05',
    customer_name: '鈴木花子',
    prospect_level: '見込みあり',
    source: 'REFERRAL',
    referrer: '浦川聖哉',
    agency_type: '既存',
    interview_status: 'INTERVIEW_DONE',
    result_status: 'CONTRACTED',
    contract_confirm: 'SENT',
    proposal_content: '28ヶ月プラン',
    amount: 550000,
    retirement_date: '2026-05-15',
    deal_notes: '成約済み。代理店A経由。契約書送付済',
    status_history: [
      {
        id: 'SH-002-01',
        deal_id: 'D-20260405-001',
        timestamp: '2026-04-05T10:30:00Z',
        user_id: 'SYSTEM',
        user_name: 'システム',
        action_type: 'STATUS_CHANGE',
        new_status: 'NEW',
        status_label: '新規',
      },
      {
        id: 'SH-002-02',
        deal_id: 'D-20260405-001',
        timestamp: '2026-04-07T15:20:30Z',
        user_id: 'USR001',
        user_name: '市岡',
        action_type: 'STATUS_CHANGE',
        old_status: 'NEW',
        new_status: 'INTERVIEWED',
        status_label: '面談済',
      },
      {
        id: 'SH-002-03',
        deal_id: 'D-20260405-001',
        timestamp: '2026-04-08T10:15:45Z',
        user_id: 'USR001',
        user_name: '市岡',
        action_type: 'STATUS_CHANGE',
        old_status: 'INTERVIEWED',
        new_status: 'CONTRACTED',
        status_label: '成約',
      },
      {
        id: 'SH-002-04',
        deal_id: 'D-20260405-001',
        timestamp: '2026-04-10T14:00:00Z',
        user_id: 'USR001',
        user_name: '市岡',
        action_type: 'STATUS_CHANGE',
        old_status: 'CONTRACTED',
        new_status: 'DETAIL_ENTERED',
        status_label: '詳細入力済',
      },
      {
        id: 'SH-002-05',
        deal_id: 'D-20260405-001',
        timestamp: '2026-04-13T09:30:00Z',
        user_id: 'USR002',
        user_name: '鈴木',
        action_type: 'STATUS_CHANGE',
        old_status: 'DETAIL_ENTERED',
        new_status: 'APPROVED',
        status_label: '事務承認済',
      },
    ],
    status: 'CONTRACTED',
    created_at: '2026-04-05T10:30:00Z',
    updated_at: '2026-04-10T14:00:00Z',
  },
  {
    id: 'D-20260310-001',
    assigned_to: 'USR001',
    deal_month: '2026/03',
    deal_date: '2026-03-10',
    customer_name: '佐藤次郎',
    prospect_level: '見込み低',
    source: 'DIRECT_LINE',
    interview_status: 'INTERVIEW_DONE',
    result_status: 'CONSIDERING',
    retirement_date: '2026-04-28',
    next_action_date: '2026-04-18',
    deal_notes: '検討中。退職日が近い。価格面で検討',
    status: 'CONSIDERING',
    created_at: '2026-03-10T11:00:00Z',
    updated_at: '2026-04-08T16:00:00Z',
  },
  {
    id: 'D-20260320-001',
    assigned_to: 'USR003',
    deal_month: '2026/03',
    deal_date: '2026-03-20',
    customer_name: '伊藤美咲',
    prospect_level: '新規',
    source: 'TIKTOK',
    interview_status: 'INTERVIEW_NO_SHOW',
    result_status: undefined,
    retirement_date: '2026-06-10',
    next_action_date: '2026-04-22',
    deal_notes: '初回面談飛び。再連絡予定',
    status: 'NEW',
    created_at: '2026-03-20T08:30:00Z',
    updated_at: '2026-04-14T10:00:00Z',
  },
  {
    id: 'D-20260315-001',
    assigned_to: 'USR001',
    deal_month: '2026/03',
    deal_date: '2026-03-15',
    customer_name: '渡辺由美',
    prospect_level: '見込みあり',
    source: 'GOOGLE_ADS',
    referrer: '高山優希',
    agency_type: '新規',
    interview_status: 'INTERVIEW_DONE',
    result_status: 'CONTRACTED',
    contract_confirm: 'COMPLETED',
    contract_date: '2026-04-01',
    proposal_content: '28ヶ月プラン',
    amount: 550000,
    retirement_date: '2026-05-30',
    deal_notes: '詳細入力完了。事務承認待ち',
    hr_proposal: '対象',
    hr_feasibility: '可',
    status: 'DETAIL_ENTERED',
    created_at: '2026-03-15T13:00:00Z',
    updated_at: '2026-04-13T09:00:00Z',
  },
  {
    id: 'D-20260301-001',
    assigned_to: 'USR003',
    deal_month: '2026/03',
    deal_date: '2026-03-01',
    customer_name: '中村健一',
    prospect_level: '再商談',
    source: 'PHONE',
    interview_status: 'RE_INTERVIEW',
    result_status: 'CONSIDERING',
    retirement_date: '2026-05-20',
    next_action_date: '2026-04-25',
    deal_notes: '再面談予定。前回は検討とのこと',
    status: 'CONSIDERING',
    created_at: '2026-03-01T15:30:00Z',
    updated_at: '2026-04-11T11:30:00Z',
  },
  {
    id: 'D-20260215-001',
    assigned_to: 'USR001',
    deal_month: '2026/02',
    deal_date: '2026-02-15',
    customer_name: '高橋裕子',
    prospect_level: '見込みあり',
    source: 'REFERRAL',
    referrer: '浦川聖哉',
    agency_type: '既存',
    interview_status: 'INTERVIEW_DONE',
    result_status: 'OUT_OF_SCOPE',
    retirement_date: '2026-05-10',
    deal_notes: '対象外判定。給付金要件を満たさない',
    status: 'OUT_OF_SCOPE',
    created_at: '2026-02-15T09:15:00Z',
    updated_at: '2026-04-12T13:45:00Z',
  },
  {
    id: 'D-20260210-001',
    assigned_to: 'USR001',
    deal_month: '2026/02',
    deal_date: '2026-02-10',
    customer_name: '川端真理',
    prospect_level: '見込みあり',
    source: 'DIRECT_LINE',
    interview_status: 'INTERVIEW_DONE',
    result_status: 'CONTRACTED',
    contract_confirm: 'COMPLETED',
    contract_date: '2026-03-01',
    proposal_content: '28ヶ月分割プラン',
    amount: 660000,
    retirement_date: '2026-04-30',
    deal_notes: '締結完了。支払管理へ移行済',
    status: 'CONTRACT_SIGNED',
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-04-14T14:00:00Z',
  },
];

// ========== Mock 顧客データ ==========

export const mockCustomers: Customer[] = [
  {
    customer_id: '2512_001',
    deal_id: 'D-20251201-001',
    contract_month: '2025/12',
    deal_date: '2025-12-01',
    assigned_to: 'USR001',
    customer_name: '栗本浩二',
    furigana: 'クリモトコウジ',
    payment_name: 'クリモトコウジ',
    phone: '09012345678',
    email: 'kurimoto@example.com',
    address: '東京都渋谷区道玄坂1-1-1',
    retirement_date: '2026-03-31',
    contract_plan: '28ヶ月',
    payment_plan: '分割',
    payment_method: '振込',
    contract_amount: 550000,
    payment_count: 12,
    payment_notes: '初回のみ金額変更あり',
    contract_status: 'ACTIVE',
    support_status: 'IN_PROGRESS',
    customer_notes: '代理店A経由',
    contract_signed: true,
    contract_date: '2026-01-15',
    payment_guide_sent: true,
    first_payment_due: '2026-02-10',
    orientation_date: '2026-01-20',
    pre_survey_sent: true,
    total_paid: 275000,
    payment_status: 'PARTIAL',
    subsequent_pay_due: '2026-05-10',
    source: '紹介',
    referrer_1: '浦川聖哉',
    referral_fee_1: 100000,
    created_at: '2025-12-15T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z',
  },
  {
    customer_id: '2511_001',
    deal_id: 'D-20251101-001',
    contract_month: '2025/11',
    deal_date: '2025-11-01',
    assigned_to: 'USR001',
    customer_name: '西山太一',
    furigana: 'ニシヤマタイチ',
    payment_name: 'ニシヤマタイチ',
    phone: '09087654321',
    email: 'nishiyama.t@example.com',
    address: '大阪府大阪市北区梅田2-3-4',
    retirement_date: '2026-01-31',
    contract_plan: '10ヶ月',
    payment_plan: '一括',
    payment_method: 'カード',
    contract_amount: 330000,
    contract_status: 'ACTIVE',
    support_status: 'COMPLETED',
    contract_signed: true,
    contract_date: '2025-12-10',
    payment_guide_sent: true,
    first_payment_due: '2025-12-20',
    orientation_date: '2025-12-15',
    pre_survey_sent: true,
    total_paid: 330000,
    payment_status: 'PAID',
    source: 'WEBシーズ_Meta',
    referrer_1: '高山優希',
    referral_fee_1: 50000,
    created_at: '2025-11-15T09:00:00Z',
    updated_at: '2026-03-20T16:00:00Z',
  },
  {
    customer_id: '2603_001',
    deal_id: 'D-20260210-001',
    contract_month: '2026/03',
    deal_date: '2026-02-10',
    assigned_to: 'USR001',
    customer_name: '川端真理',
    furigana: 'カワバタマリ',
    payment_name: 'カワバタマリ',
    phone: '08011112222',
    address: '福岡県福岡市博多区1-2-3',
    retirement_date: '2026-04-30',
    contract_plan: '28ヶ月分割',
    payment_plan: '分割',
    payment_method: '振込',
    contract_amount: 660000,
    payment_count: 24,
    contract_status: 'ACTIVE',
    support_status: 'NOT_STARTED',
    contract_signed: true,
    contract_date: '2026-03-01',
    payment_guide_sent: false,
    pre_survey_sent: false,
    total_paid: 0,
    payment_status: 'UNPAID',
    first_payment_due: '2026-04-15',
    source: '直LINE',
    created_at: '2026-03-05T10:00:00Z',
    updated_at: '2026-04-14T14:00:00Z',
  },
];

// ========== Mock 入金管理データ ==========

export const mockPayments: Payment[] = [
  {
    id: 1,
    customer_id: '2512_001',
    payment_status: 'PARTIAL',
    contract_status: 'ACTIVE',
    support_status: 'IN_PROGRESS',
    payment_name: 'クリモトコウジ',
    payment_plan: '分割',
    payment_method: '振込',
    payment_count: 12,
    paid_count: 5,
    payment_notes: '初回のみ金額変更あり',
    unpaid_amount: 275000,
    paid_amount: 275000,
    first_payment_notified: true,
    installment_notice_status: '案内終了',
    payment_due_date: '2026-05-10',
    installment_schedule: '2026年5月上旬',
    next_billing_addition: 0,
    total_late_fee: 0,
    cancellation_fee: 0,
    refund_amount: 0,
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z',
  },
  {
    id: 2,
    customer_id: '2511_001',
    payment_status: 'PAID',
    contract_status: 'ACTIVE',
    support_status: 'COMPLETED',
    payment_name: 'ニシヤマタイチ',
    payment_plan: '一括',
    payment_method: 'カード',
    payment_count: 1,
    paid_count: 1,
    unpaid_amount: 0,
    paid_amount: 330000,
    first_payment_notified: true,
    installment_notice_status: '案内終了',
    next_billing_addition: 0,
    total_late_fee: 0,
    cancellation_fee: 0,
    refund_amount: 0,
    created_at: '2025-12-20T09:00:00Z',
    updated_at: '2026-01-20T16:00:00Z',
  },
  {
    id: 3,
    customer_id: '2603_001',
    payment_status: 'UNPAID',
    contract_status: 'ACTIVE',
    support_status: 'NOT_STARTED',
    payment_name: 'カワバタマリ',
    payment_plan: '分割',
    payment_method: '振込',
    payment_count: 24,
    paid_count: 0,
    unpaid_amount: 660000,
    paid_amount: 0,
    first_payment_notified: false,
    installment_notice_status: '未案内',
    payment_due_date: '2026-04-15',
    installment_schedule: '2026年4月中旬',
    next_billing_addition: 0,
    total_late_fee: 0,
    cancellation_fee: 0,
    refund_amount: 0,
    created_at: '2026-03-05T10:00:00Z',
    updated_at: '2026-04-14T14:00:00Z',
  },
];

// ========== Mock 通知データ ==========

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
    deal_id: 'D-20260315-001',
    type: 'approval_request',
    message: '渡辺由美様の成約詳細情報が入力されました。承認をお願いします。',
    is_read: false,
    created_at: '2026-04-13T09:00:00Z',
  },
  {
    id: 'N003',
    user_id: 'USR001',
    customer_id: '2603_001',
    type: 'payment_due',
    message: '川端真理様の初回入金期日（2026/04/15）が近づいています。',
    is_read: false,
    created_at: '2026-04-12T00:00:00Z',
  },
];

// ========== Helper Functions ==========

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

export function getCustomerById(customerId: string): Customer | undefined {
  return mockCustomers.find((c) => c.customer_id === customerId);
}

export function getPaymentsByCustomer(customerId: string): Payment[] {
  return mockPayments.filter((p) => p.customer_id === customerId);
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
