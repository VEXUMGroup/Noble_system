'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type CalendarEvent = {
  id?: string | null;
  summary?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  description?: string | null;
  htmlLink?: string | null;
};

async function safeReadJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  const text = await res.text();
  const head = text.slice(0, 120).replace(/\s+/g, ' ').trim();
  throw new Error(`non_json_response status=${res.status} head=${head}`);
}

function formatStart(event: CalendarEvent): string {
  const raw = event.start?.dateTime ?? event.start?.date ?? '';
  if (!raw) return '';
  if (!event.start?.dateTime && event.start?.date) {
    const d = new Date(event.start.date + 'T00:00:00');
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' }) + ' 終日';
  }
  const d = new Date(raw);
  return (
    d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' }) +
    ' ' +
    d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  );
}

function extractRetirementDateFromDescription(description?: string | null): string {
  if (!description) return '';
  const lines = description.split('\n').map((v) => v.trim()).filter(Boolean);
  for (const line of lines) {
    const matched = line.match(/^([^:：]+)\s*[:：]\s*(.+)$/);
    if (!matched) continue;
    if (!matched[1].includes('退職予定日')) continue;
    const raw = matched[2].replace(/[年月./]/g, '-').replace(/日/g, '').replace(/\s+/g, '').trim();
    const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) continue;
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  return '';
}

export function GoogleCalendarPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [icalConfigured, setIcalConfigured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [retirementDate, setRetirementDate] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const initialized = useRef(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/google/calendar/events', { cache: 'no-store' });
      if (res.redirected) {
        setIcalConfigured(false);
        setEvents([]);
        setError('ログインが切れています（再読み込みしてください）');
        return;
      }
      const json = await safeReadJson(res);

      // 未設定 or 認証エラー → 設定ボタン表示
      if (json?.error === 'ical_not_configured' || json?.error === 'unauthorized') {
        setIcalConfigured(false);
        setEvents([]);
        return;
      }

      // URL は設定済みだが iCal fetch 失敗（configured: true が付いてくる）
      if (json?.configured === true && json?.error) {
        setIcalConfigured(true);
        setError('カレンダーの取得に失敗しました。URL を確認してください。');
        setEvents([]);
        return;
      }

      setIcalConfigured(true);
      setEvents(json.items ?? []);
    } catch (e) {
      setIcalConfigured(false);
      setError(e instanceof Error ? e.message : 'calendar_fetch_failed');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void fetchEvents();
  }, [fetchEvents]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/user/ical-url', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ical_url: inputUrl }),
      });
      if (res.redirected) {
        setSaveError('ログインが切れています（再読み込みしてください）');
        return;
      }
      const json = await safeReadJson(res);
      if (!res.ok) {
        setSaveError(json?.error ?? '保存に失敗しました');
        return;
      }
      setShowForm(false);
      setInputUrl('');
      void fetchEvents();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCalendarRegister = async () => {
    if (!selectedEvent?.id || !retirementDate) return;
    setRegistering(true);
    setRegisterError(null);
    try {
      const res = await fetch('/api/deals/from-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            id: selectedEvent.id,
            summary: selectedEvent.summary,
            start: selectedEvent.start?.dateTime ?? selectedEvent.start?.date,
            end: selectedEvent.end?.dateTime ?? selectedEvent.end?.date,
            description: selectedEvent.description,
          },
          retirement_date: retirementDate,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRegisterError(json?.message ?? json?.error ?? '登録に失敗しました');
        return;
      }
      setSelectedEvent(null);
      setRetirementDate('');
      router.push('/deals');
    } finally {
      setRegistering(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/user/ical-url', { method: 'DELETE' });
    setIcalConfigured(false);
    setEvents([]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">今後の予定（7日間）</h2>
        </div>
        <div className="flex items-center gap-2">
          {icalConfigured && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition"
            >
              URL変更
            </button>
          )}
          {icalConfigured && (
            <button
              onClick={handleDisconnect}
              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 transition"
            >
              解除
            </button>
          )}
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition disabled:opacity-50"
          >
            {loading ? '取得中...' : '更新'}
          </button>
        </div>
      </div>

      {/* iCal URL 未設定時 → 入力フォーム起動ボタン */}
      {icalConfigured === false && !showForm && (
        <div className="px-4 sm:px-6 py-8 text-center">
          <p className="text-sm text-gray-500 mb-1">Google カレンダーと連携しますか？</p>
          <p className="text-xs text-gray-400 mb-4">非公開 iCal URL を貼り付けるだけで予定が表示されます</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            iCal URL を設定する
          </button>
        </div>
      )}

      {/* URL 入力フォーム */}
      {showForm && (
        <div className="px-4 sm:px-6 py-5 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">
              Google カレンダー → 設定 → カレンダーの統合 →「非公開 iCal URL」をコピーして貼り付けてください
            </p>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !inputUrl}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setSaveError(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="mx-4 sm:mx-6 my-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {`エラー: ${error}`}
        </div>
      )}

      {/* イベントリスト */}
      <div className="divide-y divide-gray-50">
        {loading && (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            <div className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
            <p>カレンダーを読み込み中...</p>
          </div>
        )}

        {!loading && icalConfigured && !error && events.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-gray-400">今後7日間の予定はありません</div>
        )}

        {!loading &&
          events.map((ev, idx) => {
            const start = ev.start?.dateTime ?? ev.start?.date ?? '';
            const key = ev.id ?? `${start}-${idx}`;
            const isToday = start ? new Date(start).toDateString() === new Date().toDateString() : false;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedEvent(ev);
                  setRetirementDate(extractRetirementDateFromDescription(ev.description));
                  setRegisterError(null);
                }}
                className="w-full text-left px-4 sm:px-6 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isToday ? 'bg-green-400' : 'bg-blue-300'}`} />
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ev.summary ?? '（タイトルなし）'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatStart(ev)}</p>
                </div>
                {ev.htmlLink && (
                  <span className="text-xs text-blue-600 whitespace-nowrap flex-shrink-0">クリックで商談化</span>
                )}
              </button>
            );
          })}
      </div>

      {/* モーダル */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">商談として登録</h3>
                <p className="text-sm text-gray-700 truncate">{selectedEvent.summary ?? '（タイトルなし）'}</p>
                <p className="text-xs text-gray-500 mt-0.5">開始: {formatStart(selectedEvent)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setRegisterError(null);
                }}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-sm text-gray-700">説明（事前入力）</label>
              <textarea
                value={selectedEvent.description ?? ''}
                readOnly
                className="w-full border rounded p-2 text-xs text-gray-600 bg-gray-50"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">
                退職予定日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={retirementDate}
                onChange={(e) => setRetirementDate(e.target.value)}
                className="w-full border rounded p-2 text-sm"
              />
            </div>

            {registerError && <p className="text-xs text-red-600">{registerError}</p>}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setRegisterError(null);
                }}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCalendarRegister}
                disabled={registering || !retirementDate}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
              >
                {registering ? '登録中...' : '商談として登録'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
