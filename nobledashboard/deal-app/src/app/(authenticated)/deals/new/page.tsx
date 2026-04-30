'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockDeals,
  mockUsers,
  type Deal,
} from '@/lib/mock-data';

// 流入経路（エルステ経由）オプション
const FORM_SOURCES = [
  { code: 'WEB',      name: 'WEB' },
  { code: 'REF',      name: '紹介' },
  { code: 'PHONE',    name: '電話' },
  { code: 'LINE',     name: 'LINE' },
  { code: 'WEB_META', name: 'WEBシーズ_Meta' },
  { code: 'GOOGLE',   name: 'Googleリスティング' },
  { code: 'TIKTOK',   name: 'TikTok' },
];

interface FormData {
  customer_name: string;
  assigned_to: string;
  deal_date: string;
  source: string;
  retirement_date: string;
  interview_status: string;
  result_status: string;
  prospect_level: string;
  referrer: string;
  agency_type: string;
  deal_notes: string;
  next_action_date: string;
  recording_url: string;
  hr_proposal: string;
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
    interview_status: '',
    result_status: '',
    prospect_level: '',
    referrer: '',
    agency_type: '',
    deal_notes: '',
    next_action_date: '',
    recording_url: '',
    hr_proposal: '',
    remarks: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.customer_name.trim())  newErrors.customer_name = '必須項目です';
    if (!formData.assigned_to)           newErrors.assigned_to = '必須項目です';
    if (!formData.deal_date)             newErrors.deal_date = '必須項目です';
    if (!formData.source)                newErrors.source = '必須項目です';
    if (!formData.retirement_date.trim()) newErrors.retirement_date = '必須項目です';
    if (!formData.interview_status)      newErrors.interview_status = '必須項目です';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const newDeal: Deal = {
      id: `D-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(mockDeals.length + 1).padStart(3, '0')}`,
      customer_name:    formData.customer_name,
      assigned_to:      formData.assigned_to,
      deal_date:        formData.deal_date,
      source:           formData.source,
      source_code:      formData.source,
      status:           'NEW',
      retirement_date:  formData.retirement_date,
      interview_status: formData.interview_status || undefined,
      result_status:    formData.result_status || undefined,
      prospect_level:   formData.prospect_level || undefined,
      referrer:         formData.referrer || undefined,
      agency_type:      formData.agency_type || undefined,
      memo:             formData.deal_notes || undefined,
      next_action_date: formData.next_action_date || undefined,
      recording_url:    formData.recording_url || undefined,
      hr_proposal:      formData.hr_proposal || undefined,
      remarks:          formData.remarks || undefined,
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    };

    mockDeals.push(newDeal);
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${newDeal.id}`);
    }, 1200);
  };

  const handleCancel = () => {
    const hasInput = Object.values(formData).some((v) => v.trim() !== '');
    if (hasInput) {
      setShowCancelConfirm(true);
    } else {
      router.push('/deals');
    }
  };

  // スタイルヘルパー
  const inputCls = (field: keyof FormData) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;
  const selectCls = (field: keyof FormData) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;
  const baseSelectCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-blue-600">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">新規商談登録</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
          >
            登録する
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
          <p className="text-green-800 font-medium">✓ 商談を登録しました。詳細画面に移動します…</p>
        </div>
      )}

      {/* フォーム */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ===== 左カラム ===== */}
          <div className="space-y-5">

            {/* お客様氏名 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                お客様氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="例：山田 太郎"
                className={inputCls('customer_name')}
              />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
            </div>

            {/* 担当 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                担当 <span className="text-red-500">*</span>
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className={selectCls('assigned_to')}
              >
                <option value="">-- 選択してください --</option>
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {errors.assigned_to && <p className="text-red-500 text-xs mt-1">{errors.assigned_to}</p>}
            </div>

            {/* 商談日 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                商談日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="deal_date"
                value={formData.deal_date}
                onChange={handleChange}
                className={inputCls('deal_date')}
              />
              {errors.deal_date && <p className="text-red-500 text-xs mt-1">{errors.deal_date}</p>}
            </div>

            {/* 流入経路（エルステ経由） */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                流入経路（エルステ経由） <span className="text-red-500">*</span>
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className={selectCls('source')}
              >
                <option value="">-- 選択してください --</option>
                {FORM_SOURCES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
              {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
            </div>

            {/* 退職予定日 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                退職予定日 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="retirement_date"
                value={formData.retirement_date}
                onChange={handleChange}
                placeholder="例：2026-06-30 ／ 2026年6月末 ／ 未定"
                className={inputCls('retirement_date')}
              />
              <p className="text-xs text-gray-400 mt-1">日付未確定の場合は「未定」など自由記入可</p>
              {errors.retirement_date && <p className="text-red-500 text-xs mt-1">{errors.retirement_date}</p>}
            </div>
          </div>

          {/* ===== 右カラム ===== */}
          <div className="space-y-5">

            {/* 面談ステータス */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                面談ステータス <span className="text-red-500">*</span>
              </label>
              <select
                name="interview_status"
                value={formData.interview_status}
                onChange={handleChange}
                className={selectCls('interview_status')}
              >
                <option value="">-- 選択してください --</option>
                <option value="面談実施">面談実施</option>
                <option value="面談【飛び】">面談【飛び】</option>
                <option value="面談【キャンセル】">面談【キャンセル】</option>
                <option value="再面談予定">再面談予定</option>
              </select>
              {errors.interview_status && <p className="text-red-500 text-xs mt-1">{errors.interview_status}</p>}
            </div>

            {/* 結果ステータス */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">結果ステータス</label>
              <select
                name="result_status"
                value={formData.result_status}
                onChange={handleChange}
                className={baseSelectCls}
              >
                <option value="">-- 未選択 --</option>
                <option value="成約">成約</option>
                <option value="検討中">検討中</option>
                <option value="失注">失注</option>
                <option value="対象外">対象外</option>
              </select>
            </div>

            {/* 見込み顧客 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">見込み顧客</label>
              <select
                name="prospect_level"
                value={formData.prospect_level}
                onChange={handleChange}
                className={baseSelectCls}
              >
                <option value="">-- 未選択 --</option>
                <option value="見込みあり">見込みあり</option>
                <option value="見込み低">見込み低</option>
                <option value="新規">新規</option>
                <option value="再商談">再商談</option>
              </select>
            </div>

            {/* 紹介者（代理店経由） */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">紹介者（代理店経由）</label>
              <input
                type="text"
                name="referrer"
                value={formData.referrer}
                onChange={handleChange}
                placeholder="紹介者名を入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 代理店新旧 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">代理店新旧</label>
              <select
                name="agency_type"
                value={formData.agency_type}
                onChange={handleChange}
                className={baseSelectCls}
              >
                <option value="">-- 未選択 --</option>
                <option value="新規">新規</option>
                <option value="既存">既存</option>
              </select>
            </div>

            {/* 商談内容（メモ） */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">商談内容（メモ）</label>
              <textarea
                name="deal_notes"
                value={formData.deal_notes}
                onChange={handleChange}
                placeholder="商談内容のメモを入力"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 次回アクション日 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">次回アクション日</label>
              <input
                type="date"
                name="next_action_date"
                value={formData.next_action_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* レコ（動画）URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">レコ（動画）URL</label>
              <input
                type="url"
                name="recording_url"
                value={formData.recording_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 人材提案 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">人材提案</label>
              <select
                name="hr_proposal"
                value={formData.hr_proposal}
                onChange={handleChange}
                className={baseSelectCls}
              >
                <option value="">-- 未選択 --</option>
                <option value="対象">対象</option>
                <option value="対象外">対象外</option>
              </select>
            </div>

            {/* 備考欄 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">備考欄</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="備考を入力"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* キャンセル確認ダイアログ */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-2">入力内容を破棄しますか？</h2>
            <p className="text-gray-600 text-sm mb-6">保存されていない内容は失われます。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                続ける
              </button>
              <button
                onClick={() => router.push('/deals')}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
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
