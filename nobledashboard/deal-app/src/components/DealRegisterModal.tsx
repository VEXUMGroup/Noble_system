'use client';

import { useEffect, useMemo, useState } from 'react';

export type DealAutoFields = Record<string, string>;

type SelectOption = {
  code: string;
  name: string;
};

type DealRegisterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventDetails: Record<string, string>;
  autoFields: DealAutoFields;
  sources: SelectOption[];
  agencies: SelectOption[];
  onConfirm: (updatedFields: DealAutoFields) => Promise<void> | void;
};

export function DealRegisterModal({
  isOpen,
  onClose,
  eventDetails,
  autoFields,
  sources,
  agencies,
  onConfirm,
}: DealRegisterModalProps) {
  const fieldEntries = useMemo(() => Object.entries(autoFields), [autoFields]);
  const [draft, setDraft] = useState<DealAutoFields>(autoFields);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(autoFields);
    setError(null);
  }, [autoFields, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">商談登録</h3>
          <p className="text-sm text-gray-500">カレンダー予定から自動入力された内容を確認できます。</p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          <div className="rounded-xl bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">予定 विवरण</h4>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(eventDetails).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="text-sm text-gray-900 break-words">{value || '未入力'}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-4">
            {fieldEntries.map(([label, value]) => {
              const options = label === '流入経路' ? sources : label === '紹介者' ? agencies : [];
              return (
                <label key={label} className="block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
                  {options.length > 0 ? (
                    <select
                      value={draft[label] ?? ''}
                      onChange={(e) => setDraft((current) => ({ ...current, [label]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">未選択</option>
                      {options.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={draft[label] ?? value ?? ''}
                      onChange={(e) => setDraft((current) => ({ ...current, [label]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  )}
                </label>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '登録中...' : 'この内容で登録'}
          </button>
        </div>
      </div>
    </div>
  );
}
