// ========== 面談ステータス ==========
export type InterviewStatus =
  | 'INTERVIEW_DONE'
  | 'INTERVIEW_NO_SHOW'
  | 'INTERVIEW_CANCELLED'
  | 'RE_INTERVIEW';

export const INTERVIEW_STATUS_CONFIG: Record<InterviewStatus, { label: string; bgColor: string; textColor: string }> = {
  INTERVIEW_DONE:       { label: '面談実施',           bgColor: 'bg-green-600',  textColor: 'text-white' },
  INTERVIEW_NO_SHOW:    { label: '面談【飛び】',       bgColor: 'bg-red-600',    textColor: 'text-white' },
  INTERVIEW_CANCELLED:  { label: '面談【キャンセル】', bgColor: 'bg-gray-500',   textColor: 'text-white' },
  RE_INTERVIEW:         { label: '再面談予定',         bgColor: 'bg-amber-500',  textColor: 'text-white' },
};

// ========== 結果ステータス ==========
export type ResultStatus =
  | 'CONTRACTED'
  | 'CONSIDERING'
  | 'LOST'
  | 'OUT_OF_SCOPE';

export const RESULT_STATUS_CONFIG: Record<ResultStatus, { label: string; bgColor: string; textColor: string }> = {
  CONTRACTED:   { label: '成約',   bgColor: 'bg-green-600',  textColor: 'text-white' },
  CONSIDERING:  { label: '検討中', bgColor: 'bg-blue-600',   textColor: 'text-white' },
  LOST:         { label: '失注',   bgColor: 'bg-red-600',    textColor: 'text-white' },
  OUT_OF_SCOPE: { label: '対象外', bgColor: 'bg-red-600',    textColor: 'text-white' },
};

// ========== 契約書締結確認 ==========
export type ContractConfirmStatus = 'NOT_SENT' | 'SENT' | 'WAITING_RETURN' | 'COMPLETED';

export const CONTRACT_CONFIRM_CONFIG: Record<ContractConfirmStatus, { label: string; bgColor: string; textColor: string }> = {
  NOT_SENT:        { label: '未送付',   bgColor: 'bg-gray-500',   textColor: 'text-white' },
  SENT:            { label: '送付済',   bgColor: 'bg-blue-600',   textColor: 'text-white' },
  WAITING_RETURN:  { label: '回収待ち', bgColor: 'bg-amber-500',  textColor: 'text-white' },
  COMPLETED:       { label: '完了',     bgColor: 'bg-green-600',  textColor: 'text-white' },
};

// ========== 契約ステータス ==========
export type ContractStatus = 'ACTIVE' | 'CANCELLED';

export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; bgColor: string; textColor: string }> = {
  ACTIVE:    { label: '成約',       bgColor: 'bg-green-600',  textColor: 'text-white' },
  CANCELLED: { label: 'キャンセル', bgColor: 'bg-red-600',    textColor: 'text-white' },
};

// ========== サポートステータス ==========
export type SupportStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'STOPPED';

export const SUPPORT_STATUS_CONFIG: Record<SupportStatus, { label: string; bgColor: string; textColor: string }> = {
  NOT_STARTED:  { label: '未対応', bgColor: 'bg-gray-500',   textColor: 'text-white' },
  IN_PROGRESS:  { label: '対応中', bgColor: 'bg-blue-600',   textColor: 'text-white' },
  COMPLETED:    { label: '完了',   bgColor: 'bg-green-600',  textColor: 'text-white' },
  STOPPED:      { label: '停止',   bgColor: 'bg-red-600',    textColor: 'text-white' },
};

// ========== 支払いステータス ==========
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID' | 'CANCELLED';

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; bgColor: string; textColor: string }> = {
  UNPAID:    { label: '未入金',       bgColor: 'bg-red-600',    textColor: 'text-white' },
  PARTIAL:   { label: '一部入金',     bgColor: 'bg-amber-500',  textColor: 'text-white' },
  PAID:      { label: '全額入金完了', bgColor: 'bg-green-600',  textColor: 'text-white' },
  OVERPAID:  { label: '過剰入金',     bgColor: 'bg-red-600',    textColor: 'text-white' },
  CANCELLED: { label: 'キャンセル',   bgColor: 'bg-gray-500',   textColor: 'text-white' },
};

// ========== ステータス変更履歴 ==========
export type HistoryActionType = 'STATUS_CHANGE' | 'MEMO' | 'FIELD_EDIT';

export interface StatusHistory {
  id: string;
  deal_id: string;
  timestamp: string;           // ISO 8601形式の日時
  user_id: string;
  user_name: string;
  action_type: HistoryActionType;
  old_status?: string;         // STATUS_CHANGEの場合は前のステータス
  new_status?: string;         // STATUS_CHANGEの場合は新しいステータス
  status_label?: string;       // 表示用ラベル（例：「面談済」）
  memo?: string;               // メモテキスト
  source?: string;             // データ取得元（例：「Googleカレンダーから自動取得」）
  // FIELD_EDITの場合
  field_key?: string;          // 変更されたフィールド (例: 'customer_name')
  field_label?: string;        // 表示用ラベル (例: '顧客名')
  old_value?: string;          // 変更前の値 (表示用文字列)
  new_value?: string;          // 変更後の値 (表示用文字列)
}

// ========== 汎用ステータスバッジ取得 ==========
export interface StatusConfigItem {
  label: string;
  bgColor: string;
  textColor: string;
}

export function getStatusConfig(type: string, value: string): StatusConfigItem {
  const configs: Record<string, Record<string, StatusConfigItem>> = {
    interview: INTERVIEW_STATUS_CONFIG,
    result: RESULT_STATUS_CONFIG,
    contractConfirm: CONTRACT_CONFIRM_CONFIG,
    contract: CONTRACT_STATUS_CONFIG,
    support: SUPPORT_STATUS_CONFIG,
    payment: PAYMENT_STATUS_CONFIG,
  };
  return configs[type]?.[value] ?? { label: value, bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
}

// ========== 旧互換用（ダッシュボード集計等で使用） ==========
export type DealStatus =
  | 'NEW'
  | 'INTERVIEWED'
  | 'CONTRACTED'
  | 'CONSIDERING'
  | 'OUT_OF_SCOPE'
  | 'DETAIL_ENTERED'
  | 'APPROVED'
  | 'AWAITING_CONTRACT'
  | 'CONTRACT_SIGNED'
  | 'PAYMENT_MANAGING'
  | 'COMPLETED';

export const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  NEW: { label: '新規', bgColor: 'bg-blue-600', textColor: 'text-white' },
  INTERVIEWED: { label: '面談済', bgColor: 'bg-green-600', textColor: 'text-white' },
  CONTRACTED: { label: '成約', bgColor: 'bg-green-600', textColor: 'text-white' },
  CONSIDERING: { label: '検討', bgColor: 'bg-blue-600', textColor: 'text-white' },
  OUT_OF_SCOPE: { label: '対象外', bgColor: 'bg-red-600', textColor: 'text-white' },
  DETAIL_ENTERED: { label: '詳細入力済', bgColor: 'bg-blue-600', textColor: 'text-white' },
  APPROVED: { label: '事務承認済', bgColor: 'bg-green-600', textColor: 'text-white' },
  AWAITING_CONTRACT: { label: '締結待ち', bgColor: 'bg-amber-500', textColor: 'text-white' },
  CONTRACT_SIGNED: { label: '締結済', bgColor: 'bg-green-600', textColor: 'text-white' },
  PAYMENT_MANAGING: { label: '支払管理中', bgColor: 'bg-blue-600', textColor: 'text-white' },
  COMPLETED: { label: '完了', bgColor: 'bg-green-600', textColor: 'text-white' },
};

export const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  NEW: ['INTERVIEWED'],
  INTERVIEWED: ['CONTRACTED', 'CONSIDERING', 'OUT_OF_SCOPE'],
  CONTRACTED: ['DETAIL_ENTERED'],
  CONSIDERING: ['CONTRACTED', 'OUT_OF_SCOPE'],
  OUT_OF_SCOPE: [],
  DETAIL_ENTERED: ['APPROVED', 'CONTRACTED'],
  APPROVED: ['AWAITING_CONTRACT'],
  AWAITING_CONTRACT: ['CONTRACT_SIGNED'],
  CONTRACT_SIGNED: ['PAYMENT_MANAGING'],
  PAYMENT_MANAGING: ['COMPLETED'],
  COMPLETED: [],
};
