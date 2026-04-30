'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockDeals,
  mockUsers,
  mockSources,
  mockAgencies,
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
    if (!formData.customer_name.trim()) newErrors.customer_name = '必須項目です';
    if (!formData.assigned_to) newErrors.assigned_to = '必須項目です';
    if (!formData.deal_date) newErrors.deal_date = '必須項目です';
    if (!formData.source) newErrors.source = '必須項目です';
    if (!formData.retirement_date.trim()) newErrors.retirement_date = '必須項目です';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const newDeal: Deal = {
      id: `D-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(mockDeals.length + 1).padStart(3, '0')}`,
      customer_name: formData.customer_name,
      assigned_to: formData.assigned_to,
      deal_date: formData.deal_date,
      source: formData.source,
      source_code: formData.source,
      status: 'NEW',
      retirement_date: formData.retirement_date,
      agency_code: formData.agency_code || undefined,
      memo: formData.memo || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  const inputClass = (field: keyof FormData) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-blue-600">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">新規商談登録</h1>
          <p className="text-xs text-gray-500 mt-1">基本情報を登録します。面談結果は登録後の詳細画面から入力できます。</p>
        </div>
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

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-5">

        {/* 顧客名 */}
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
            className={inputClass('customer_name')}
          />
          {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 担当者 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              担当者 <span className="text-red-500">*</span>
            </label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className={inputClass('assigned_to')}
            >
              <option value="">-- 選択 --</option>
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
              className={inputClass('deal_date')}
            />
            {errors.deal_date && <p className="text-red-500 text-xs mt-1">{errors.deal_date}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 流入経路 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              流入経路 <span className="text-red-500">*</span>
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className={inputClass('source')}
            >
              <option value="">-- 選択 --</option>
              {mockSources.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
          </div>

          {/* 代理店 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">代理店</label>
            <select
              name="agency_code"
              value={formData.agency_code}
              onChange={handleChange}
              className={inputClass('agency_code')}
            >
              <option value="">-- なし --</option>
              {mockAgencies.map((a) => (
                <option key={a.code} value={a.code}>{a.name}</option>
              ))}
            </select>
          </div>
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
            className={inputClass('retirement_date')}
          />
          <p className="text-xs text-gray-400 mt-1">日付未確定の場合は「未定」など自由記入可</p>
          {errors.retirement_date && <p className="text-red-500 text-xs mt-1">{errors.retirement_date}</p>}
        </div>

        {/* メモ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">メモ</label>
          <textarea
            name="memo"
            value={formData.memo}
            onChange={handleChange}
            placeholder="商談の概要・補足など"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
          ※ 面談ステータス・結果（成約 / 検討 / 対象外 / 失注）・人材提案は、登録後の商談詳細画面から入力します。
        </p>
      </div>

      {/* キャンセル確認 */}
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
