'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { prospectLevels, agencyTypes } from '@/lib/constants';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useMasterData } from '@/lib/useMasterData';
import AgencySearchSelect from '@/components/ui/AgencySearchSelect';
import { validateDealProgressInput } from '@/lib/deal-progress-validation';
import { nullIfEmpty, writeDealWithMissingColumnFallback } from '@/lib/deal-write';

interface FormData {
  customer_name: string;
  assigned_to: string;
  deal_date: string;
  source: string;
  retirement_date: string;
  age: string;
  email: string;
  phone: string;
  result_status: string;
  prospect_level: string;
  referrer: string;
  agency_type: string;
  memo: string;
  next_action_date: string;
  recording_url: string;
  remarks: string;
}

export default function NewDealPage() {
  const router = useRouter();
  const { users, sources, statuses, agencies } = useMasterData();
  const resultStatuses = statuses.filter(s => s.code.startsWith('RS_'));


  const [formData, setFormData] = useState<FormData>({
    customer_name: '',
    assigned_to: '',
    deal_date: '',
    source: '',
    retirement_date: '',
    age: '',
    email: '',
    phone: '',
    result_status: '',
    prospect_level: '',
    referrer: '',
    agency_type: '',
    memo: '',
    next_action_date: '',
    recording_url: '',
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
    const validation = validateDealProgressInput(
      {
        assigned_to: formData.assigned_to,
        deal_date: formData.deal_date,
        age: formData.age,
        email: formData.email,
        source: formData.source,
        referrer: formData.referrer,
      },
      {
        sourceCodes: sources.map((s) => s.code),
        agencyCodes: agencies.map((a) => a.code),
      }
    );
    setErrors(validation.errors as Partial<Record<keyof FormData, string>>);
    return validation.isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const dealId = `D-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const newDeal = {
      id: dealId,
      customer_name: formData.customer_name,
      assigned_to: formData.assigned_to,
      deal_date: formData.deal_date,
      source: formData.source,
      age: nullIfEmpty(formData.age),
      status: 'NEW', // マイグレーション 003 実行後は NULL 許容に変更予定
      retirement_date: nullIfEmpty(formData.retirement_date),
      email: formData.email || undefined,
      custom_data: {
        age: formData.age ? Number(String(formData.age).replace(/[^\d]/g, '')) || formData.age : undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      },
      phone: formData.phone || undefined,
      result_status: formData.result_status || undefined,
      prospect_level: formData.prospect_level || undefined,
      referrer: formData.referrer || undefined,
      agency_type: formData.agency_type || undefined,
      memo: formData.memo || undefined,
      next_action_date: nullIfEmpty(formData.next_action_date),
      recording_url: formData.recording_url || undefined,
      remarks: formData.remarks || undefined,
      created_by: 'USR001', // System user (暫定：マイグレーション 003 の NOT NULL DROP 実行待機中)
      updated_by: 'USR001', // System user (暫定：マイグレーション 003 の NOT NULL DROP 実行待機中)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = createSupabaseBrowserClient();
    const { error } = await writeDealWithMissingColumnFallback(
      'deals/new insert',
      newDeal,
      async (payload) => await supabase.from('deals').insert(payload)
    );
    if (error) {
      setErrors((prev) => ({ ...prev, customer_name: error.message }));
      return;
    }
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${dealId}`);
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

  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-blue-600">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">新規商談登録</h1>
          <p className="text-xs text-gray-500 mt-1">基本情報・面談結果・メモをまとめて登録できます。</p>
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

      {/* 上段：基本情報・面談関連（2カラム） */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* === 左カラム === */}
          {/* お客様氏名 */}
          <div>
            <label className={labelClass}>
              お客様氏名
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="例: 山田太郎"
              className={inputCls('customer_name')}
            />
            {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
          </div>

          {/* 担当 */}
          <div>
            <label className={labelClass}>
              担当 <span className="text-red-500">*</span>
            </label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className={selectCls('assigned_to')}
            >
              <option value="">-- 選択してください --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            {errors.assigned_to && <p className="text-red-500 text-xs mt-1">{errors.assigned_to}</p>}
          </div>

          {/* 結果ステータス */}
          <div>
            <label className={labelClass}>結果ステータス</label>
            <select
              name="result_status"
              value={formData.result_status}
              onChange={handleChange}
              className={selectCls('result_status')}
            >
              <option value="">-- 未選択 --</option>
              {resultStatuses.map((s) => (
                <option key={s.code} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 商談日 */}
          <div>
            <label className={labelClass}>
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

          {/* 年齢 */}
          <div>
            <label className={labelClass}>
              年齢 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="例：60"
              className={inputCls('age')}
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label className={labelClass}>
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@example.com"
              className={inputCls('email')}
            />
          </div>

          {/* 電話番号 */}
          <div>
            <label className={labelClass}>電話番号</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="090-xxxx-xxxx"
              className={inputCls('phone')}
            />
          </div>

          {/* 見込み顧客 */}
          <div>
            <label className={labelClass}>見込み顧客</label>
            <select
              name="prospect_level"
              value={formData.prospect_level}
              onChange={handleChange}
              className={selectCls('prospect_level')}
            >
              <option value="">-- 未選択 --</option>
              {prospectLevels.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 流入経路（エルステ経由） */}
          <div>
            <label className={labelClass}>
              流入経路（エルステ経由） <span className="text-red-500">*</span>
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className={selectCls('source')}
            >
              <option value="">-- 選択してください --</option>
              {sources.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
          </div>

          {/* 紹介者（代理店経由） */}
          <div>
            <label className={labelClass}>紹介者（代理店経由）</label>
            <AgencySearchSelect
              value={formData.referrer}
              onChange={(code) =>
                setFormData((prev) => ({ ...prev, referrer: code }))
              }
              agencies={agencies.map((a) => ({ code: a.code, name: a.name }))}
              placeholder="-- 未選択 --"
            />
            {errors.referrer && <p className="text-red-500 text-xs mt-1">{errors.referrer}</p>}
            {!errors.referrer && (
              <p className="text-xs text-gray-500 mt-1">流入経路または紹介者のどちらか一方を入力してください。</p>
            )}
          </div>

          {/* 退職予定日 */}
          <div>
            <label className={labelClass}>
              退職予定日
            </label>
            <input
              type="text"
              name="retirement_date"
              value={formData.retirement_date}
              onChange={handleChange}
              placeholder="例：2026年6月末、今月末"
              className={inputCls('retirement_date')}
            />
            {errors.retirement_date && <p className="text-red-500 text-xs mt-1">{errors.retirement_date}</p>}
          </div>

          {/* 代理店新旧 */}
          <div>
            <label className={labelClass}>代理店新旧</label>
            <select
              name="agency_type"
              value={formData.agency_type}
              onChange={handleChange}
              className={selectCls('agency_type')}
            >
              <option value="">-- 未選択 --</option>
              {agencyTypes.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 下段：商談内容・次回アクション・備考欄 */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        {/* 商談内容（メモ） */}
        <div>
          <label className={labelClass}>商談内容（メモ）</label>
          <textarea
            name="memo"
            value={formData.memo}
            onChange={handleChange}
            placeholder="商談で話した内容や次回対応内容のメモ"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 2カラム：次回アクション日・レコURL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>次回アクション日</label>
            <input
              type="date"
              name="next_action_date"
              value={formData.next_action_date}
              onChange={handleChange}
              className={inputCls('next_action_date')}
            />
          </div>

          <div>
            <label className={labelClass}>レコ（動画）URL</label>
            <input
              type="url"
              name="recording_url"
              value={formData.recording_url}
              onChange={handleChange}
              placeholder="https://..."
              className={inputCls('recording_url')}
            />
          </div>
        </div>

        {/* 備考欄 */}
        <div>
          <label className={labelClass}>備考欄</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="その他補足事項"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
