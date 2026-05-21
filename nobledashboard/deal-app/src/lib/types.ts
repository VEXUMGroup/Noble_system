export type DealStatus =
  | 'NEW'
  | 'INTERVIEWED'
  | 'CONTRACTED'
  | 'CONSIDERING'
  | 'OUT_OF_SCOPE'
  | 'LOST'
  | 'DETAIL_ENTERED'
  | 'APPROVED'
  | 'CONTRACT_SIGNED'
  | 'PAYMENT_MANAGING'
  | 'COMPLETED';

export interface StatusConfigItem {
  label: string;
  bgColor: string;
  textColor: string;
}

export const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  NEW: { label: '新規', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  INTERVIEWED: { label: '面談済', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  CONTRACTED: { label: '成約', bgColor: 'bg-teal-100', textColor: 'text-teal-800' },
  CONSIDERING: { label: '検討', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  OUT_OF_SCOPE: { label: '対象外', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  LOST: { label: '失注', bgColor: 'bg-rose-100', textColor: 'text-rose-800' },
  DETAIL_ENTERED: { label: '詳細入力済', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' },
  APPROVED: { label: '事務承認済', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  CONTRACT_SIGNED: { label: '締結済', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
  PAYMENT_MANAGING: { label: '支払管理中', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
  COMPLETED: { label: '完了', bgColor: 'bg-slate-100', textColor: 'text-slate-800' },
};

// ステータス変更の自由度を上げるため、前後双方向＋Skipも許容する緩和版。
// 完了後に戻ることは基本想定しないが、誤操作リカバリのため CONSIDERING / CONTRACTED への戻し経路は残す。
export const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  NEW: ['INTERVIEWED', 'CONTRACTED', 'CONSIDERING', 'OUT_OF_SCOPE', 'LOST'],
  INTERVIEWED: ['CONTRACTED', 'CONSIDERING', 'OUT_OF_SCOPE', 'LOST'],
  CONTRACTED: ['DETAIL_ENTERED', 'CONSIDERING', 'LOST'],
  CONSIDERING: ['CONTRACTED', 'OUT_OF_SCOPE', 'LOST', 'INTERVIEWED'],
  OUT_OF_SCOPE: ['CONSIDERING', 'CONTRACTED'],
  LOST: ['CONSIDERING', 'CONTRACTED'],
  DETAIL_ENTERED: ['APPROVED', 'CONTRACTED', 'CONSIDERING'],
  APPROVED: ['CONTRACT_SIGNED', 'DETAIL_ENTERED'],
  CONTRACT_SIGNED: ['PAYMENT_MANAGING', 'APPROVED'],
  PAYMENT_MANAGING: ['COMPLETED', 'CONTRACT_SIGNED'],
  COMPLETED: ['PAYMENT_MANAGING'],
};

/**
 * 結果ステータス（新規商談画面などで営業が直接選べる区分）と
 * 内部 DealStatus のマッピング。
 */
export const RESULT_STATUS_TO_DEAL_STATUS: Record<string, DealStatus> = {
  成約: 'CONTRACTED',
  検討: 'CONSIDERING',
  失注: 'LOST',
  対象外: 'OUT_OF_SCOPE',
};
