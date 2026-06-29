export type DealStatus =
  | 'NEW'
  | 'ST_MEETING'
  | 'ST_CANCEL'
  | 'ST_FLY'
  | 'ST_LINE_BLK'
  | 'INTERVIEWED'
  | 'CONTRACTED'
  | 'CONSIDERING'
  | 'OUT_OF_SCOPE'
  | 'LOST'
  | 'RS_CONTRACT'
  | 'RS_LOST'
  | 'RS_OUT_SCOPE'
  | 'RS_PEND'
  | 'RS_IN_PROG'
  | 'RS_REDEAL'
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
  ST_MEETING: { label: '面談実施', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  ST_CANCEL: { label: '商談【キャンセル】', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  ST_FLY: { label: '商談【飛び】', bgColor: 'bg-rose-100', textColor: 'text-rose-800' },
  ST_LINE_BLK: { label: 'LINEブロック', bgColor: 'bg-slate-100', textColor: 'text-slate-800' },
  INTERVIEWED: { label: '面談済', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  CONTRACTED: { label: '成約', bgColor: 'bg-teal-100', textColor: 'text-teal-800' },
  CONSIDERING: { label: '検討', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  OUT_OF_SCOPE: { label: '対象外', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  LOST: { label: '失注', bgColor: 'bg-rose-100', textColor: 'text-rose-800' },
  RS_CONTRACT: { label: '成約', bgColor: 'bg-teal-100', textColor: 'text-teal-800' },
  RS_LOST: { label: '失注', bgColor: 'bg-rose-100', textColor: 'text-rose-800' },
  RS_OUT_SCOPE: { label: 'サポート対象外', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  RS_PEND: { label: '検討', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  RS_IN_PROG: { label: '商談中', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
  RS_REDEAL: { label: '再商談', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' },
  DETAIL_ENTERED: { label: '詳細入力済', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' },
  APPROVED: { label: '事務承認済', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  CONTRACT_SIGNED: { label: '締結済', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
  PAYMENT_MANAGING: { label: '支払管理中', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
  COMPLETED: { label: '完了', bgColor: 'bg-slate-100', textColor: 'text-slate-800' },
};

export const INTERVIEW_STATUS_CODES: DealStatus[] = ['ST_MEETING', 'ST_CANCEL', 'ST_FLY', 'ST_LINE_BLK'];

export const RESULT_STATUS_CODES: DealStatus[] = ['RS_CONTRACT', 'RS_LOST', 'RS_OUT_SCOPE', 'RS_PEND', 'RS_IN_PROG', 'RS_REDEAL'];

export const LEGACY_RESULT_STATUS_CODES: DealStatus[] = ['CONTRACTED', 'CONSIDERING', 'OUT_OF_SCOPE', 'LOST'];

export const ACTIVE_STATUS_CODES: DealStatus[] = [
  'NEW',
  'ST_MEETING',
  'ST_CANCEL',
  'ST_FLY',
  'ST_LINE_BLK',
  'INTERVIEWED',
  'CONTRACTED',
  'CONSIDERING',
  'OUT_OF_SCOPE',
  'LOST',
  'RS_CONTRACT',
  'RS_LOST',
  'RS_OUT_SCOPE',
  'RS_PEND',
  'RS_IN_PROG',
  'RS_REDEAL',
  'DETAIL_ENTERED',
  'APPROVED',
  'CONTRACT_SIGNED',
  'PAYMENT_MANAGING',
  'COMPLETED',
];

export const CONTRACT_STAGE_CODES: DealStatus[] = ['CONTRACTED', 'RS_CONTRACT', 'DETAIL_ENTERED', 'APPROVED', 'CONTRACT_SIGNED', 'PAYMENT_MANAGING', 'COMPLETED'];

export const CLOSING_STATUS_CODES: DealStatus[] = CONTRACT_STAGE_CODES;

export function getStatusLabel(status: string): string {
  return STATUS_CONFIG[status]?.label ?? status;
}

export function isInterviewStatus(status: string): boolean {
  return INTERVIEW_STATUS_CODES.includes(status as DealStatus);
}

export function isResultStatus(status: string): boolean {
  return RESULT_STATUS_CODES.includes(status as DealStatus) || LEGACY_RESULT_STATUS_CODES.includes(status as DealStatus);
}

export function isContractStage(status: string): boolean {
  return CONTRACT_STAGE_CODES.includes(status as DealStatus);
}

export function isClosingStatus(status: string): boolean {
  return CLOSING_STATUS_CODES.includes(status as DealStatus);
}

// ステータス変更の自由度を上げるため、前後双方向＋Skipも許容する緩和版。
// 完了後に戻ることは基本想定しないが、誤操作リカバリのため CONSIDERING / CONTRACTED への戻し経路は残す。
export const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  NEW: ['ST_MEETING', 'ST_CANCEL', 'ST_FLY', 'ST_LINE_BLK', 'INTERVIEWED', 'CONTRACTED', 'CONSIDERING', 'OUT_OF_SCOPE', 'LOST'],
  ST_MEETING: ['RS_CONTRACT', 'RS_PEND', 'RS_IN_PROG', 'RS_REDEAL', 'RS_OUT_SCOPE', 'RS_LOST'],
  ST_CANCEL: ['NEW', 'ST_MEETING'],
  ST_FLY: ['NEW', 'ST_MEETING'],
  ST_LINE_BLK: ['NEW', 'ST_MEETING'],
  INTERVIEWED: ['CONTRACTED', 'CONSIDERING', 'OUT_OF_SCOPE', 'LOST', 'RS_CONTRACT', 'RS_PEND', 'RS_IN_PROG', 'RS_REDEAL', 'RS_OUT_SCOPE', 'RS_LOST'],
  CONTRACTED: ['DETAIL_ENTERED', 'CONSIDERING', 'LOST', 'RS_CONTRACT', 'RS_PEND', 'RS_IN_PROG', 'RS_REDEAL', 'RS_OUT_SCOPE', 'RS_LOST'],
  CONSIDERING: ['CONTRACTED', 'OUT_OF_SCOPE', 'LOST', 'INTERVIEWED', 'RS_CONTRACT', 'RS_OUT_SCOPE', 'RS_LOST'],
  OUT_OF_SCOPE: ['CONSIDERING', 'CONTRACTED', 'RS_REDEAL', 'RS_PEND'],
  LOST: ['CONSIDERING', 'CONTRACTED', 'RS_REDEAL', 'RS_PEND'],
  RS_CONTRACT: ['DETAIL_ENTERED', 'APPROVED', 'CONTRACT_SIGNED', 'PAYMENT_MANAGING', 'COMPLETED'],
  RS_LOST: ['RS_REDEAL', 'RS_PEND', 'CONTRACTED'],
  RS_OUT_SCOPE: ['RS_REDEAL', 'RS_PEND', 'CONTRACTED'],
  RS_PEND: ['RS_CONTRACT', 'RS_OUT_SCOPE', 'RS_LOST', 'RS_REDEAL', 'RS_IN_PROG'],
  RS_IN_PROG: ['RS_CONTRACT', 'RS_PEND', 'RS_REDEAL'],
  RS_REDEAL: ['ST_MEETING', 'RS_PEND', 'RS_IN_PROG'],
  DETAIL_ENTERED: ['APPROVED', 'CONTRACTED', 'CONSIDERING', 'RS_CONTRACT'],
  APPROVED: ['CONTRACT_SIGNED', 'DETAIL_ENTERED', 'RS_CONTRACT'],
  CONTRACT_SIGNED: ['PAYMENT_MANAGING', 'APPROVED', 'RS_CONTRACT'],
  PAYMENT_MANAGING: ['COMPLETED', 'CONTRACT_SIGNED', 'RS_CONTRACT'],
  COMPLETED: ['PAYMENT_MANAGING', 'RS_CONTRACT'],
};

/**
 * 結果ステータス（新規商談画面などで営業が直接選べる区分）と
 * 内部 DealStatus のマッピング。
 */
export const RESULT_STATUS_TO_DEAL_STATUS: Record<string, DealStatus> = {
  成約: 'RS_CONTRACT',
  検討: 'RS_PEND',
  商談中: 'RS_IN_PROG',
  再商談: 'RS_REDEAL',
  失注: 'RS_LOST',
  対象外: 'RS_OUT_SCOPE',
  サポート対象外: 'RS_OUT_SCOPE',
};
