'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  STATUS_CONFIG,
  VALID_TRANSITIONS,
  RESULT_STATUS_TO_DEAL_STATUS,
  type DealStatus,
} from '@/lib/types';
import {
  mockDeals,
  mockUsers,
  mockPlans,
  mockSources,
  mockAgencies,
  interviewStatuses,
  resultStatuses,
  prospectLevels,
  agencyTypes,
  hrProposalOptions,
  hrFeasibilityOptions,
  consideringReasons,
  outOfScopeReasons,
  lostReasons,
  getUserName,
  type Deal,
} from '@/lib/mock-data';

interface FormData {
  customer_name: string;
  assigned_to: string;
  deal_date: string;
  source: string;
  retirement_date: string;
  agency_code: string;
  memo: string;
  interview_status: string;
  result_status: string;
  prospect_level: string;
  referrer: string;
  agency_type: string;
  next_action_date: string;
  recording_url: string;
  hr_proposal: string;
  hr_feasibility: string;
  hr_target_28m: boolean;
  considering_reason: string;
  considering_reason_comment: string;
  out_of_scope_reason: string;
  out_of_scope_reason_comment: string;
  lost_reason: string;
  lost_reason_comment: string;
  remarks: string;
}

export default function NewDealPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    customer_name: '',
    assigned_to: '',
    deal_date: '',
    source: '',
    retirement_date: '',
    agency_code: '',
    memo: '',
    interview_status: '',
    result_status: '',
    prospect_level: '',
    referrer: '',
    agency_type: '',
    next_action_date: '',
    recording_url: '',
    hr_proposal: '',
    hr_feasibility: '',
    hr_target_28m: false,
    considering_reason: '',
    considering_reason_comment: '',
    out_of_scope_reason: '',
    out_of_scope_reason_comment: '',
    lost_reason: '',
    lost_reason_comment: '',
    remarks: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => {
      const next = { ...prev, [name]: newValue } as FormData;
      // 結果ステータス変更時、不要な理由フィールドをクリアする
      if (name === 'result_status') {
        if (value !== '検討') {
          next.considering_reason = '';
          next.considering_reason_comment = '';
        }
        if (value !== '対象外') {
          next.out_of_scope_reason = '';
          next.out_of_scope_reason_comment = '';
        }
        if (value !== '失注') {
          next.lost_reason = '';
          next.lost_reason_comment = '';
        }
      }
      return next;
    });
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = '必須項目です';
    if (!formData.assigned_to) newErrors.assigned_to = '必須項目です';
    if (!formData.deal_date) newErrors.deal_date = '必須項目です';
    if (!formData.source) newErrors.source = '必須項目です';
    if (!formData.retirement_date) newErrors.retirement_date = '必須項目です';
    if (!formData.interview_status) newErrors.interview_status = '必須項目です';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // 結果ステータスが選ばれていれば、内部 DealStatus を自動で進める
    let mappedStatus: DealStatus = 'NEW';
    if (formData.result_status && RESULT_STATUS_TO_DEAL_STATUS[formData.result_status]) {
      mappedStatus = RESULT_STATUS_TO_DEAL_STATUS[formData.result_status];
    } else if (formData.interview_status === '面談実施') {
      mappedStatus = 'INTERVIEWED';
    }

    const newDeal: Deal = {
      id: `D-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(mockDeals.length + 1).padStart(3, '0')}`,
      customer_name: formData.customer_name,
      assigned_to: formData.assigned_to,
      deal_date: formData.deal_date,
      source: formData.source,
      status: mappedStatus,
      retirement_date: formData.retirement_date,
      agency_code: formData.agency_code || undefined,
      memo: formData.memo || undefined,
      interview_status: formData.interview_status || undefined,
      result_status: formData.result_status || undefined,
      prospect_level: formData.prospect_level || undefined,
      referrer: formData.referrer || undefined,
      agency_type: formData.agency_type || undefined,
      next_action_date: formData.next_action_date || undefined,
      recording_url: formData.recording_url || undefined,
      hr_proposal: formData.hr_proposal || undefined,
      hr_feasibility: formData.hr_feasibility || undefined,
      hr_target_28m: formData.hr_target_28m || undefined,
      considering_reason: formData.considering_reason || undefined,
      considering_reason_comment: formData.considering_reason_comment || undefined,
      out_of_scope_reason: formData.out_of_scope_reason || undefined,
      out_of_scope_reason_comment: formData.out_of_scope_reason_comment || undefined,
      lost_reason: formData.lost_reason || undefined,
      lost_reason_comment: formData.lost_reason_comment || undefined,
      remarks: formData.remarks || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDeals.push(newDeal);
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${newDeal.id}`);
    }, 1500);
  };

  const handleCancel = () => {
    const hasInput = Object.values(formData).some((v) => {
      if (typeof v === 'string') return v.trim() !== '';
      if (typeof v === 'boolean') return v === true;
      return false;
    });
    if (hasInput) {
      setShowCancelConfirm(true);
    } else {
      router.push('/dashboard');
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    router.push('/dashboard');
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-blue-600 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">新規商談登録</h1>
          <p className="text-xs text-gray-500 mt-1">新規案件の基本情報入力フォーム｜対象: 営業</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
          >
            保存
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2 border border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 font-medium text-sm transition"
          >
            キャンセル
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">商談を保存しました</p>
        </div>
      )}

      {/* Main Form - 2 Column Layout */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
          {/* 左カラム */}
          <div>
            <p className="text-xs font-bold text-blue-600 mb-3">左カラム</p>

            {/* 氏名 */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                お客様氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="例: 山田太郎"
                className={inputClass('customer_name')}
              />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
            </div>

            {/* 担当 */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                担当 <span className="text-red-500">*</span>
              </label>
              <select name="assigned_to" value={formData.assigned_to} onChange={handleChange} className={inputClass('assigned_to')}>
                <option value="">-- 選択してください --</option>
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {errors.assigned_to && <p className="text-red-500 text-xs mt-1">{errors.assigned_to}</p>}
            </div>

            {/* 商談日 */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                商談日 <span className="text-red-500">*</span>
              </label>
              <input type="date" name="deal_date" value={formData.deal_date} onChange={handleChange} className={inputClass('deal_date')} />
              {errors.deal_date && <p className="text-red-500 text-xs mt-1">{errors.deal_date}</p>}
            </div>

            {/* 流入経路 */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                流入経路（エルステ経由） <span className="text-red-500">*</span>
              </label>
              <select name="source" value={formData.source} onChange={handleChange} className={inputClass('source')}>
                <option value="">-- 選択してください --</option>
                {mockSources.map((source) => (
                  <option key={source.code} value={source.code}>{source.name}</option>
                ))}
              </select>
              {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
            </div>

            {/* 退職予定日（自由記入） */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                退職予定日 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="retirement_date"
                value={formData.retirement_date}
                onChange={handleChange}
                placeholder="例: 2026-06-30 / 2026年6月末 / 未定"
                className={inputClass('retirement_date')}
              />
              <p className="text-[11px] text-gray-400 mt-1">日付が未確定の場合は「2026年6月末頃」「未定」など自由に記入できます。</p>
              {errors.retirement_date && <p className="text-red-500 text-xs mt-1">{errors.retirement_date}</p>}
            </div>
          </div>

          {/* 右カラム */}
          <div>
            <p className="text-xs font-bold text-blue-600 mb-3">右カラム</p>

            {/* 面談ステータス */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                面談ステータス <span className="text-red-500">*</span>
              </label>
              <select name="interview_status" value={formData.interview_status} onChange={handleChange} className={inputClass('interview_status')}>
                <option value="">-- 選択してください --</option>
                {interviewStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.interview_status && <p className="text-red-500 text-xs mt-1">{errors.interview_status}</p>}
            </div>

            {/* 結果ステータス */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">結果ステータス</label>
              <select name="result_status" value={formData.result_status} onChange={handleChange} className={inputClass('result_status')}>
                <option value="">-- 未選択 --</option>
                {resultStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">成約/検討/失注/対象外 から選択。選択に応じて内部ステータスが自動で更新されます。</p>
            </div>

            {/* 検討理由（検討のとき） */}
            {formData.result_status === '検討' && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  検討理由 <span className="text-gray-400">（プルダウン＋コメント）</span>
                </label>
                <select
                  name="considering_reason"
                  value={formData.considering_reason}
                  onChange={handleChange}
                  className={inputClass('considering_reason')}
                >
                  <option value="">-- 選択してください --</option>
                  {consideringReasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <textarea
                  name="considering_reason_comment"
                  value={formData.considering_reason_comment}
                  onChange={handleChange}
                  placeholder="補足コメント（任意）"
                  rows={2}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* 対象外理由（対象外のとき） */}
            {formData.result_status === '対象外' && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  対象外理由 <span className="text-gray-400">（プルダウン＋コメント）</span>
                </label>
                <select
                  name="out_of_scope_reason"
                  value={formData.out_of_scope_reason}
                  onChange={handleChange}
                  className={inputClass('out_of_scope_reason')}
                >
                  <option value="">-- 選択してください --</option>
                  {outOfScopeReasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <textarea
                  name="out_of_scope_reason_comment"
                  value={formData.out_of_scope_reason_comment}
                  onChange={handleChange}
                  placeholder="補足コメント（任意）"
                  rows={2}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* 失注理由（失注のとき） */}
            {formData.result_status === '失注' && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  失注理由 <span className="text-gray-400">（プルダウン＋コメント）</span>
                </label>
                <select
                  name="lost_reason"
                  value={formData.lost_reason}
                  onChange={handleChange}
                  className={inputClass('lost_reason')}
                >
                  <option value="">-- 選択してください --</option>
                  {lostReasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <textarea
                  name="lost_reason_comment"
                  value={formData.lost_reason_comment}
                  onChange={handleChange}
                  placeholder="補足コメント（任意）"
                  rows={2}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* 見込み顧客 */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">見込み顧客</label>
              <select name="prospect_level" value={formData.prospect_level} onChange={handleChange} className={inputClass('prospect_level')}>
                <option value="">-- 未選択 --</option>
                {prospectLevels.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* 紹介者 */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">紹介者（代理店経由）</label>
              <input
                type="text"
                name="referrer"
                value={formData.referrer}
                onChange={handleChange}
                placeholder="例: 代理店A"
                className={inputClass('referrer')}
              />
            </div>

            {/* 代理店新旧 */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">代理店新旧</label>
              <select name="agency_type" value={formData.agency_type} onChange={handleChange} className={inputClass('agency_type')}>
                <option value="">-- 未選択 --</option>
                {agencyTypes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Memo & Additional Fields */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* メモ */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">商談内容（メモ）</label>
          <textarea
            name="memo"
            value={formData.memo}
            onChange={handleChange}
            placeholder="商談で話した内容や次回対応内容のメモ"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 2-column row（上段） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">次回アクション日</label>
            <input type="date" name="next_action_date" value={formData.next_action_date} onChange={handleChange} className={inputClass('next_action_date')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">レコ（動画）URL</label>
            <input type="text" name="recording_url" value={formData.recording_url} onChange={handleChange} placeholder="https://..." className={inputClass('recording_url')} />
          </div>
        </div>

        {/* 人材提案グループ（対象区分 + 可否 + 28ヶ月） */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-bold text-blue-700 mb-2">人材提案</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">対象区分</label>
              <select name="hr_proposal" value={formData.hr_proposal} onChange={handleChange} className={inputClass('hr_proposal')}>
                <option value="">-- 未選択 --</option>
                {hrProposalOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">可否</label>
              <select name="hr_feasibility" value={formData.hr_feasibility} onChange={handleChange} className={inputClass('hr_feasibility')}>
                <option value="">-- 未選択 --</option>
                {hrFeasibilityOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 pb-2">
                <input
                  type="checkbox"
                  name="hr_target_28m"
                  checked={formData.hr_target_28m}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                28ヶ月対象
              </label>
            </div>
          </div>
        </div>

        {/* 備考欄 */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">備考欄</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="その他補足事項"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">※ IDは自動採番のため画面に表示しません。登録後に採番結果を表示します。</p>

      {/* キャンセル確認ダイアログ */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold mb-3">入力内容を破棄しますか？</h2>
            <p className="text-gray-600 mb-6 text-sm">
              入力中の内容は保存されません。ダッシュボードに戻りますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                入力を続ける
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                破棄して戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
