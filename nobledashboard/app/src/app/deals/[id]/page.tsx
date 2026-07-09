'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  INTERVIEW_STATUS_CONFIG,
  RESULT_STATUS_CONFIG,
  CONTRACT_CONFIRM_CONFIG,
  type InterviewStatus,
  type ResultStatus,
  type ContractConfirmStatus,
  type StatusHistory,
} from '@/lib/types';
import {
  mockUsers,
  mockSources,
  getUserName,
  getSourceName,
  formatCurrency,
  formatDate,
  currentUser,
  type Deal,
} from '@/lib/mock-data';
import {
  getDeal,
  updateDeal,
  updateDealResultStatus,
  addStatusHistoryBatch,
} from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusTimeline } from '@/components/ui/StatusTimeline';

interface DealDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// ========== 編集対象フィールド定義 ==========
type EditableFieldKey =
  | 'customer_name'
  | 'assigned_to'
  | 'deal_month'
  | 'deal_date'
  | 'age'
  | 'source'
  | 'retirement_date'
  | 'referrer'
  | 'agency_type'
  | 'prospect_level'
  | 'next_action_date'
  | 'deal_notes'
  | 'remarks'
  | 'proposal_content'
  | 'amount'
  | 'contract_confirm'
  | 'contract_date'
  | 'hr_proposal'
  | 'hr_feasibility'
  | 'hr_reason'
  | 'recording_url'
  | 'interview_status'
  | 'result_status';

const FIELD_LABELS: Record<EditableFieldKey, string> = {
  customer_name: '顧客名',
  assigned_to: '担当',
  deal_month: '商談月',
  deal_date: '商談日',
  age: '年齢',
  source: '流入経路',
  retirement_date: '退職予定日',
  referrer: '紹介者',
  agency_type: '代理店区分',
  prospect_level: '見込み度',
  next_action_date: '次回アクション日',
  deal_notes: '商談内容メモ',
  remarks: '備考',
  proposal_content: '提案内容',
  amount: '成約金額',
  contract_confirm: '契約書締結確認',
  contract_date: '締結日',
  hr_proposal: '人材提案',
  hr_feasibility: '人材可否',
  hr_reason: '可否理由',
  recording_url: 'レコ（動画）URL',
  interview_status: '面談ステータス',
  result_status: '結果ステータス',
};

// ========== 値を表示用文字列に変換 ==========
function formatFieldValue(key: EditableFieldKey, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const str = String(value);
  switch (key) {
    case 'assigned_to':
      return getUserName(str);
    case 'source':
      return getSourceName(str);
    case 'amount':
      return formatCurrency(Number(str));
    case 'deal_date':
    case 'retirement_date':
    case 'next_action_date':
    case 'contract_date':
      return formatDate(str);
    case 'interview_status':
      return INTERVIEW_STATUS_CONFIG[str as InterviewStatus]?.label ?? str;
    case 'result_status':
      return RESULT_STATUS_CONFIG[str as ResultStatus]?.label ?? str;
    case 'contract_confirm':
      return CONTRACT_CONFIRM_CONFIG[str as ContractConfirmStatus]?.label ?? str;
    default:
      return str;
  }
}

function formatAmountInput(value?: number): string {
  return typeof value === 'number' ? value.toLocaleString('ja-JP') : '';
}

function resolveDealAgeValue(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
}

function getDealAgeValue(deal: Record<string, any> | null | undefined): string {
  if (!deal) return '';
  return resolveDealAgeValue(deal.age, deal.custom_data?.age);
}

function getEditableAgeValue(draftAge: unknown, deal: Record<string, any> | null | undefined): string {
  return resolveDealAgeValue(draftAge) || getDealAgeValue(deal);
}

function parseAmountInput(value: string): number | undefined {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : undefined;
}

const FIELD_LABEL_CLASS = 'text-sm text-gray-600 mb-1';

type FieldProps = {
  field: EditableFieldKey;
  children: React.ReactNode;
  colSpan?: boolean;
};

function Field({ field, children, colSpan }: FieldProps) {
  return (
    <div className={colSpan ? 'sm:col-span-2' : ''}>
      <p className={FIELD_LABEL_CLASS}>{FIELD_LABELS[field]}</p>
      {children}
    </div>
  );
}

export default function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = use(params);

  // 編集ステート
  const [deal, setDeal] = useState<Deal | undefined>(undefined);
  const [draft, setDraft] = useState<Deal | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ResultStatus | null>(null);
  const [outOfScopeReason, setOutOfScopeReason] = useState('');

  // 初回ロード（Supabaseから取得）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const d = await getDeal(id);
      if (cancelled) return;
      if (d) {
        setDeal(d);
        setDraft(d);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!deal || !draft) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">404</h1>
            <p className="text-gray-600">申し訳ございません。該当する商談が見つかりません。</p>
          </div>
        </div>
      </div>
    );
  }

  // ========== 編集モード制御 ==========
  const startEditing = () => {
    setDraft({ ...deal });
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft({ ...deal });
    setEditing(false);
  };

  const updateDraft = <K extends keyof Deal>(key: K, value: Deal[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  // ========== 保存（差分計算 → DB書き込み → 履歴追記） ==========
  const saveChanges = async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const newHistoryEntries: StatusHistory[] = [];
      const patch: Partial<Deal> = {};

      (Object.keys(FIELD_LABELS) as EditableFieldKey[]).forEach((key) => {
        const before = (deal as unknown as Record<string, unknown>)[key];
        const after = (draft as unknown as Record<string, unknown>)[key];

        const beforeNorm = before === undefined || before === null ? '' : String(before);
        const afterNorm = after === undefined || after === null ? '' : String(after);
        if (beforeNorm === afterNorm) return;

        (patch as Record<string, unknown>)[key] = after;

        newHistoryEntries.push({
          id: `SH-${draft.id}-${Date.now()}-${key}`,
          deal_id: draft.id,
          timestamp: now,
          user_id: currentUser.id,
          user_name: currentUser.name,
          action_type: 'FIELD_EDIT',
          field_key: key,
          field_label: FIELD_LABELS[key],
          old_value: formatFieldValue(key, before),
          new_value: formatFieldValue(key, after),
        });
      });

      if (newHistoryEntries.length === 0) {
        setEditing(false);
        return;
      }

      const updated = await updateDeal(draft.id, patch, currentUser.id);
      if (!updated) {
        alert('保存に失敗しました。通信環境をご確認ください。');
        return;
      }
      await addStatusHistoryBatch(newHistoryEntries);

      const merged: Deal = {
        ...updated,
        status_history: [...(deal.status_history ?? []), ...newHistoryEntries],
      };
      setDeal(merged);
      setDraft(merged);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleResultChange = async (newStatus: ResultStatus) => {
    if (newStatus === 'OUT_OF_SCOPE') {
      setPendingStatus(newStatus);
      setOutOfScopeReason(deal.out_of_scope_reason ?? '');
      setShowConfirm(true);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const { deal: updated, history } = await updateDealResultStatus({
        dealId: deal.id,
        oldStatus: deal.result_status,
        newStatus,
        newStatusLabel: RESULT_STATUS_CONFIG[newStatus]?.label ?? newStatus,
        userId: currentUser.id,
        userName: currentUser.name,
      });
      if (!updated) {
        alert('ステータス更新に失敗しました。');
        return;
      }
      const merged: Deal = {
        ...updated,
        status_history: [
          ...(deal.status_history ?? []),
          ...(history ? [history] : []),
        ],
      };
      setDeal(merged);
      setDraft(merged);
    } finally {
      setSaving(false);
    }
  };

  const confirmOutOfScope = async () => {
    if (!pendingStatus || saving) return;
    setSaving(true);
    try {
      const { deal: updated, history } = await updateDealResultStatus({
        dealId: deal.id,
        oldStatus: deal.result_status,
        newStatus: pendingStatus,
        newStatusLabel: RESULT_STATUS_CONFIG[pendingStatus]?.label ?? pendingStatus,
        outOfScopeReason: outOfScopeReason.trim(),
        userId: currentUser.id,
        userName: currentUser.name,
      });
      if (!updated) {
        alert('ステータス更新に失敗しました。');
        return;
      }
      const merged: Deal = {
        ...updated,
        status_history: [
          ...(deal.status_history ?? []),
          ...(history ? [history] : []),
        ],
      };
      setDeal(merged);
      setDraft(merged);
      setShowConfirm(false);
      setPendingStatus(null);
      setOutOfScopeReason('');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">ID: {deal.id}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{deal.customer_name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={deal.interview_status} type="interview" />
          {deal.result_status && <StatusBadge status={deal.result_status} type="result" />}
          {!editing ? (
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm"
            >
              編集
            </button>
          ) : (
            <>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium text-sm"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium text-sm"
              >
                キャンセル
              </button>
            </>
          )}
        </div>
      </div>

      {/* ステータス変更履歴 */}
      <StatusTimeline history={deal.status_history} />

      {/* 対象外理由（保存済みなら表示） */}
      {deal.result_status === 'OUT_OF_SCOPE' && deal.out_of_scope_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-800 mb-1">対象外の理由</p>
          <p className="text-gray-800 whitespace-pre-wrap">{deal.out_of_scope_reason}</p>
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">基本情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Field field="customer_name">
            {editing ? (
              <input
                className={inputCls}
                value={draft.customer_name ?? ''}
                onChange={(e) => updateDraft('customer_name', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 font-medium">{deal.customer_name}</p>
            )}
          </Field>

          <Field field="assigned_to">
            {editing ? (
              <select
                className={inputCls}
                value={draft.assigned_to ?? ''}
                onChange={(e) => updateDraft('assigned_to', e.target.value)}
              >
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{getUserName(deal.assigned_to)}</p>
            )}
          </Field>

          <Field field="deal_month">
            {editing ? (
              <input
                className={inputCls}
                placeholder="YYYY/MM"
                value={draft.deal_month ?? ''}
                onChange={(e) => updateDraft('deal_month', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 font-medium">{deal.deal_month}</p>
            )}
          </Field>

          <Field field="deal_date">
            {editing ? (
              <input
                type="date"
                className={inputCls}
                value={draft.deal_date ?? ''}
                onChange={(e) => updateDraft('deal_date', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 font-medium">{formatDate(deal.deal_date)}</p>
            )}
          </Field>

          <Field field="age">
            {editing ? (
              <input
                type="text"
                inputMode="numeric"
                className={inputCls}
                value={getEditableAgeValue(draft.age, deal)}
                onChange={(e) => updateDraft('age', e.target.value)}
                placeholder="60"
              />
            ) : (
              <p className="text-gray-900 font-medium">{getDealAgeValue(deal) || '-'}</p>
            )}
          </Field>

          <Field field="source">
            {editing ? (
              <select
                className={inputCls}
                value={draft.source ?? ''}
                onChange={(e) => updateDraft('source', e.target.value)}
              >
                {mockSources.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{getSourceName(deal.source)}</p>
            )}
          </Field>

          <Field field="retirement_date">
            {editing ? (
              <input
                type="date"
                className={inputCls}
                value={draft.retirement_date ?? ''}
                onChange={(e) => updateDraft('retirement_date', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 font-medium">{formatDate(deal.retirement_date)}</p>
            )}
          </Field>

          <Field field="referrer">
            {editing ? (
              <input
                className={inputCls}
                value={draft.referrer ?? ''}
                onChange={(e) => updateDraft('referrer', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 font-medium">{deal.referrer ?? '-'}</p>
            )}
          </Field>

          <Field field="agency_type">
            {editing ? (
              <select
                className={inputCls}
                value={draft.agency_type ?? ''}
                onChange={(e) => updateDraft('agency_type', e.target.value)}
              >
                <option value="">-</option>
                <option value="新規">新規</option>
                <option value="既存">既存</option>
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{deal.agency_type ?? '-'}</p>
            )}
          </Field>

          <Field field="prospect_level">
            {editing ? (
              <select
                className={inputCls}
                value={draft.prospect_level ?? ''}
                onChange={(e) => updateDraft('prospect_level', e.target.value)}
              >
                <option value="">-</option>
                <option value="見込みあり">見込みあり</option>
                <option value="見込み低">見込み低</option>
                <option value="新規">新規</option>
                <option value="再商談">再商談</option>
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{deal.prospect_level ?? '-'}</p>
            )}
          </Field>

          <Field field="next_action_date">
            {editing ? (
              <input
                type="date"
                className={inputCls}
                value={draft.next_action_date ?? ''}
                onChange={(e) => updateDraft('next_action_date', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 font-medium">{formatDate(deal.next_action_date)}</p>
            )}
          </Field>

          <Field field="deal_notes" colSpan>
            {editing ? (
              <textarea
                rows={3}
                className={inputCls}
                value={draft.deal_notes ?? ''}
                onChange={(e) => updateDraft('deal_notes', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{deal.deal_notes ?? '-'}</p>
            )}
          </Field>

          <Field field="remarks" colSpan>
            {editing ? (
              <textarea
                rows={2}
                className={inputCls}
                value={draft.remarks ?? ''}
                onChange={(e) => updateDraft('remarks', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{deal.remarks ?? '-'}</p>
            )}
          </Field>
        </div>
      </div>

      {/* 成約情報 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">成約情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Field field="proposal_content">
            {editing ? (
              <input
                className={inputCls}
                value={draft.proposal_content ?? ''}
                onChange={(e) => updateDraft('proposal_content', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 font-medium">{deal.proposal_content ?? '-'}</p>
            )}
          </Field>

          <Field field="amount">
            {editing ? (
              <input
                type="text"
                inputMode="numeric"
                className={inputCls}
                value={formatAmountInput(draft.amount)}
                onChange={(e) => updateDraft('amount', parseAmountInput(e.target.value))}
                placeholder="330000"
              />
            ) : (
              <p className="text-gray-900 font-medium">{formatCurrency(deal.amount)}</p>
            )}
          </Field>

          <Field field="contract_confirm">
            {editing ? (
              <select
                className={inputCls}
                value={draft.contract_confirm ?? ''}
                onChange={(e) =>
                  updateDraft(
                    'contract_confirm',
                    (e.target.value || undefined) as ContractConfirmStatus | undefined
                  )
                }
              >
                <option value="">-</option>
                {Object.entries(CONTRACT_CONFIRM_CONFIG).map(([code, c]) => (
                  <option key={code} value={code}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : deal.contract_confirm ? (
              <StatusBadge status={deal.contract_confirm} type="contractConfirm" />
            ) : (
              <p className="text-gray-900 font-medium">-</p>
            )}
          </Field>

          <Field field="contract_date">
            {editing ? (
              <input
                type="date"
                className={inputCls}
                value={draft.contract_date ?? ''}
                onChange={(e) => updateDraft('contract_date', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 font-medium">{formatDate(deal.contract_date)}</p>
            )}
          </Field>
        </div>
      </div>

      {/* 人材提案 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">人材提案</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Field field="hr_proposal">
            {editing ? (
              <select
                className={inputCls}
                value={draft.hr_proposal ?? ''}
                onChange={(e) => updateDraft('hr_proposal', e.target.value)}
              >
                <option value="">-</option>
                <option value="対象">対象</option>
                <option value="対象外">対象外</option>
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{deal.hr_proposal ?? '-'}</p>
            )}
          </Field>

          <Field field="hr_feasibility">
            {editing ? (
              <select
                className={inputCls}
                value={draft.hr_feasibility ?? ''}
                onChange={(e) => updateDraft('hr_feasibility', e.target.value)}
              >
                <option value="">-</option>
                <option value="可">可</option>
                <option value="否">否</option>
                <option value="判定前">判定前</option>
              </select>
            ) : (
              <p className="text-gray-900 font-medium">{deal.hr_feasibility ?? '-'}</p>
            )}
          </Field>

          <Field field="hr_reason" colSpan>
            {editing ? (
              <textarea
                rows={2}
                className={inputCls}
                value={draft.hr_reason ?? ''}
                onChange={(e) => updateDraft('hr_reason', e.target.value)}
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{deal.hr_reason ?? '-'}</p>
            )}
          </Field>
        </div>
      </div>

      {/* 録画 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">レコ（動画）</h2>
        {editing ? (
          <input
            className={inputCls}
            value={draft.recording_url ?? ''}
            onChange={(e) => updateDraft('recording_url', e.target.value)}
            placeholder="https://..."
          />
        ) : deal.recording_url ? (
          <a
            href={deal.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {deal.recording_url}
          </a>
        ) : (
          <p className="text-gray-500">未登録</p>
        )}
      </div>

      {/* ステータス操作 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">ステータス操作</h2>

        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Field field="interview_status">
              <select
                className={inputCls}
                value={draft.interview_status}
                onChange={(e) => updateDraft('interview_status', e.target.value as InterviewStatus)}
              >
                {Object.entries(INTERVIEW_STATUS_CONFIG).map(([code, c]) => (
                  <option key={code} value={code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field field="result_status">
              <select
                className={inputCls}
                value={draft.result_status ?? ''}
                onChange={(e) =>
                  updateDraft(
                    'result_status',
                    (e.target.value || undefined) as ResultStatus | undefined
                  )
                }
              >
                <option value="">-</option>
                {Object.entries(RESULT_STATUS_CONFIG).map(([code, c]) => (
                  <option key={code} value={code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {deal.interview_status === 'INTERVIEW_DONE' && !deal.result_status && (
              <>
                <button
                  onClick={() => handleResultChange('CONTRACTED')}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-medium"
                >
                  成約
                </button>
                <button
                  onClick={() => handleResultChange('CONSIDERING')}
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-300 font-medium"
                >
                  検討
                </button>
                <button
                  onClick={() => {
                    setPendingStatus('OUT_OF_SCOPE');
                    setOutOfScopeReason(deal.out_of_scope_reason ?? '');
                    setShowConfirm(true);
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-300 font-medium"
                >
                  対象外
                </button>
              </>
            )}

            {deal.result_status === 'CONSIDERING' && (
              <>
                <button
                  onClick={() => handleResultChange('CONTRACTED')}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-medium"
                >
                  成約へ変更
                </button>
                <button
                  onClick={() => {
                    setPendingStatus('OUT_OF_SCOPE');
                    setOutOfScopeReason(deal.out_of_scope_reason ?? '');
                    setShowConfirm(true);
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-300 font-medium"
                >
                  対象外へ変更
                </button>
              </>
            )}

            {deal.result_status === 'CONTRACTED' && deal.status === 'CONTRACTED' && (
              <Link
                href={`/deals/${id}/contract-detail`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-block"
              >
                詳細入力へ進む
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 対象外 確認ダイアログ（理由欄つき） */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-2">対象外に変更しますか?</h2>
            <p className="text-gray-600 mb-4">
              この操作は取り消せません。対象外とする理由を入力してください。
            </p>
            <label className="block text-sm text-gray-700 mb-1">対象外の理由</label>
            <textarea
              rows={4}
              value={outOfScopeReason}
              onChange={(e) => setOutOfScopeReason(e.target.value)}
              placeholder="例：給付金要件を満たさない、他社と契約済み、など"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setPendingStatus(null);
                  setOutOfScopeReason('');
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={confirmOutOfScope}
                disabled={saving || outOfScopeReason.trim() === ''}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
              >
                {saving ? '保存中...' : '確定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
