'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'loading' | 'configured' | 'not_configured' | 'error';

export function ICalSettingsBar() {
  const [status, setStatus] = useState<Status>('loading');
  const [showForm, setShowForm] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initialized = useRef(false);

  const checkStatus = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/google/calendar/events', { cache: 'no-store' });
      const json = await res.json();
      if (json?.error === 'ical_not_configured' || json?.error === 'unauthorized') {
        setStatus('not_configured');
      } else if (!res.ok) {
        setStatus('error');
      } else {
        setStatus('configured');
      }
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void checkStatus();
  }, [checkStatus]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/user/ical-url', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ical_url: inputUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json?.error ?? '保存に失敗しました');
        return;
      }
      setShowForm(false);
      setInputUrl('');
      setStatus('configured');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/user/ical-url', { method: 'DELETE' });
    setStatus('not_configured');
    setShowForm(false);
    setInputUrl('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* カレンダーアイコン */}
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* ステータス表示 */}
        {status === 'loading' && (
          <span className="text-sm text-gray-400">カレンダー連携を確認中...</span>
        )}

        {status === 'configured' && !showForm && (
          <>
            <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Google カレンダー連携済み
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-2.5 py-1 rounded-md transition"
            >
              URL を変更
            </button>
            <button
              onClick={handleDisconnect}
              className="text-xs text-gray-400 hover:text-red-500 hover:border-red-300 border border-gray-200 px-2.5 py-1 rounded-md transition"
            >
              解除
            </button>
          </>
        )}

        {status === 'not_configured' && !showForm && (
          <>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
              Google カレンダー未連携
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md font-medium transition"
            >
              iCal URL を設定する
            </button>
          </>
        )}

        {status === 'error' && !showForm && (
          <>
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              カレンダー連携エラー
            </span>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md transition"
            >
              URL を再設定
            </button>
          </>
        )}

        {/* URL 入力フォーム */}
        {showForm && (
          <div className="w-full mt-2 space-y-2">
            <p className="text-xs text-gray-500">
              Google カレンダー → 設定 → カレンダーの統合 →「非公開 iCal URL」をコピーして貼り付けてください
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !inputUrl}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setSaveError(null); setInputUrl(''); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
