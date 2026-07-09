import React, { useState, ChangeEvent } from 'react';
import AgencySearchSelect from '@/components/ui/AgencySearchSelect';
import { validateCalendarDealInput, type CalendarDealErrors } from '@/lib/calendar-deal-validation';

export interface DealAutoFields {
  顧客名: string;
  担当者: string;
  退職予定日: string; // YYYY-MM-DD
  商談日: string; // YYYY-MM-DD
  年齢: string;
  メールアドレス: string;
  電話番号: string;
  流入経路: string; // m_sources.code
  紹介者: string; // deals.referrer (agency code)
}

function normalizeYmd(input: string): string {
  const raw = (input ?? '').trim();
  if (!raw) return '';
  // Accept exact YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // Accept YYYY/MM/DD ... (e.g. "2026/05/29 9:00")
  const m1 = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (m1) return `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`;
  // Accept ISO datetime
  const m2 = raw.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return raw;
}

function formatMd(inputYmd: string): string {
  const ymd = normalizeYmd(inputYmd);
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${Number(m[2])}/${Number(m[3])}`;
}

/** Read‑only event information extracted from the Google Calendar entry */
interface EventDetails {
  [key: string]: string;
}

interface DealRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** カレンダーから取得した情報（読み取り専用） */
  eventDetails: EventDetails;
  /** 自動で埋め込まれる項目（ユーザーが編集可能） */
  autoFields: DealAutoFields;
  sources?: Array<{ code: string; name: string }>;
  agencies?: Array<{ code: string; name: string }>;
  /** 確定時に呼び出すコールバック。編集後のデータが渡される */
  onConfirm: (updatedFields: DealAutoFields) => Promise<void> | void;
}

/**
 * Premium‑looking modal that:
 *   • displays the event details (read‑only)
 *   • shows the auto‑filled fields but lets the user edit them
 *   • returns the edited fields via onConfirm
 */
export const DealRegisterModal: React.FC<DealRegisterModalProps> = ({
  isOpen,
  onClose,
  eventDetails,
  autoFields,
  sources = [],
  agencies = [],
  onConfirm,
}) => {
  if (!isOpen) return null;

  // ---------- 編集可能なフィールドをローカルステートで管理 ----------
  const [editable, setEditable] = useState<DealAutoFields>({
    ...autoFields,
    退職予定日: normalizeYmd(autoFields.退職予定日),
    商談日: normalizeYmd(autoFields.商談日),
  });
  const [errors, setErrors] = useState<CalendarDealErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: keyof CalendarDealErrors) => {
    setErrors((prev) => {
      if (field === 'source' || field === 'referrer') {
        const next = { ...prev };
        delete next.source;
        delete next.referrer;
        return next;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange =
    (field: keyof DealAutoFields) => (e: ChangeEvent<HTMLInputElement>) => {
      setEditable((prev) => ({ ...prev, [field]: e.target.value }));
      if (field === '顧客名') clearFieldError('customer_name');
      if (field === '担当者') clearFieldError('assigned_to');
      if (field === '退職予定日') clearFieldError('retirement_date');
      if (field === '商談日') clearFieldError('deal_date');
      if (field === '年齢') clearFieldError('age');
      if (field === 'メールアドレス') clearFieldError('email');
      setSubmitError(null);
    };

  const handleSubmit = async () => {
    const validation = validateCalendarDealInput(
      {
        customer_name: editable.顧客名,
        assigned_to: editable.担当者,
        retirement_date: editable.退職予定日,
        deal_date: editable.商談日,
        age: editable.年齢,
        email: editable.メールアドレス,
        source: editable.流入経路,
        referrer: editable.紹介者,
        phone: editable.電話番号,
      },
      {
        sourceCodes: sources.map((s) => s.code),
        agencyCodes: agencies.map((a) => a.code),
        requireSourceOrReferrer: false,
        skipSourceCodeValidation: true,
        skipAgencyCodeValidation: true,
      }
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      setSubmitError('必須項目を入力してください');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirm(editable);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : '登録に失敗しました';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-hidden rounded-xl bg-white shadow-xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">商談として登録</h2>
          <p className="text-sm text-gray-600 mt-0.5">カレンダー情報を確認し、必要なら編集してください。</p>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-900">登録できませんでした</p>
              <p className="text-sm text-red-800 mt-1 break-words">{submitError}</p>
            </div>
          )}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">カレンダー情報</h3>
            <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {Object.entries(eventDetails).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-3 px-4 py-3">
                  <dt className="col-span-1 text-xs font-medium text-gray-500">{key}</dt>
                  <dd
                    className={
                      key === '説明'
                        ? 'col-span-2 text-sm text-gray-900 max-h-40 overflow-y-auto whitespace-pre-line'
                        : 'col-span-2 text-sm text-gray-900 break-words'
                    }
                  >
                    {value || '―'}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">自動入力項目（編集可）</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col">
                <span className="text-xs font-medium text-gray-600 mb-1">顧客名 <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={editable.顧客名}
                  onChange={handleChange('顧客名')}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                    errors.customer_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.customer_name && <span className="mt-1 text-xs text-red-600">{errors.customer_name}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-medium text-gray-600 mb-1">担当者 <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  value={editable.担当者}
                  onChange={handleChange('担当者')}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                    errors.assigned_to ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.assigned_to && <span className="mt-1 text-xs text-red-600">{errors.assigned_to}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-medium text-gray-600 mb-1">退職予定日 <span className="text-red-500">*</span></span>
                <input
                  type="date"
                  value={editable.退職予定日}
                  onChange={handleChange('退職予定日')}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                    errors.retirement_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.retirement_date && <span className="mt-1 text-xs text-red-600">{errors.retirement_date}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-medium text-gray-600 mb-1">商談日 <span className="text-red-500">*</span></span>
                <input
                  type="date"
                  value={editable.商談日}
                  onChange={handleChange('商談日')}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                    errors.deal_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.deal_date && <span className="mt-1 text-xs text-red-600">{errors.deal_date}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-medium text-gray-600 mb-1">流入経路</span>
                <select
                  value={editable.流入経路}
                  onChange={(e) => {
                    setEditable((prev) => ({ ...prev, 流入経路: e.target.value }));
                    clearFieldError('source');
                    setSubmitError(null);
                  }}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                    errors.source ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">未設定</option>
                  {sources.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="mt-1 text-[11px] text-gray-500">紹介者とどちらか一方を入力してください。</span>
                {errors.source && <span className="mt-1 text-xs text-red-600">{errors.source}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-medium text-gray-600 mb-1">紹介者</span>
                <AgencySearchSelect
                  value={editable.紹介者}
                  onChange={(code) => {
                    setEditable((prev) => ({ ...prev, 紹介者: code }));
                    clearFieldError('referrer');
                    setSubmitError(null);
                  }}
                  agencies={agencies}
                  placeholder="-- 未選択 --"
                  hasError={Boolean(errors.referrer)}
                />
                {errors.referrer && <span className="mt-1 text-xs text-red-600">{errors.referrer}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-medium text-gray-600 mb-1">年齢 <span className="text-red-500">*</span></span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editable.年齢}
                  onChange={handleChange('年齢')}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.age && <span className="mt-1 text-xs text-red-600">{errors.age}</span>}
              </label>
              <label className="flex flex-col">
                <span className="text-xs font-medium text-gray-600 mb-1">メールアドレス <span className="text-red-500">*</span></span>
                <input
                  type="email"
                  value={editable.メールアドレス}
                  onChange={handleChange('メールアドレス')}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <span className="mt-1 text-xs text-red-600">{errors.email}</span>}
              </label>
              <label className="flex flex-col sm:col-span-2">
                <span className="text-xs font-medium text-gray-600 mb-1">電話番号</span>
                <input
                  type="tel"
                  value={editable.電話番号}
                  onChange={handleChange('電話番号')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            onClick={onClose}
            disabled={submitting}
          >
            キャンセル
          </button>
          <button
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '登録中…' : '登録'}
          </button>
        </div>
      </div>
    </div>
  );
};
