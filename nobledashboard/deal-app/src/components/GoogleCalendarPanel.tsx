'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DealRegisterModal } from '@/components/DealRegisterModal';
import type { DealAutoFields } from '@/components/DealRegisterModal';
import { validateCalendarDealInput } from '@/lib/calendar-deal-validation';
import { isSpecialCalendarEvent } from '@/lib/ical';
import { useCurrentUser } from '@/lib/user-context';
import { getAgencies, getSources, type MAgency, type MSource } from '@/lib/supabase';

type CalendarEvent = {
  id?: string | null;
  summary?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  description?: string | null;
  htmlLink?: string | null;
  is_special_event?: boolean | null;
};

function formatDateTimeJst(raw: string): string {
  if (!raw) return '';
  // date-only (all-day) is already in local calendar date semantics
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const date = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
  const time = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${date} ${time}`;
}

async function safeReadJson(res: Response, context: string): Promise<any> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  const text = await res.text();
  const head = text.slice(0, 120).replace(/\s+/g, ' ').trim();
  console.error(`[safeReadJson] non-json response context=${context} status=${res.status} head=${head}`);
  return { error: `non_json_response context=${context} status=${res.status} head=${head}` };
}

function formatStart(event: CalendarEvent): string {
  const raw = event.start?.dateTime ?? event.start?.date ?? '';
  if (!raw) return '';
  if (!event.start?.dateTime && event.start?.date) {
    const d = new Date(event.start.date + 'T00:00:00');
    const date = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    }).format(d);
    return date + ' 終日';
  }
  return formatDateTimeJst(raw);
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

function extractCustomerNameFromDescription(description?: string | null): string {
  if (!description) return '';
  const lines = description.split('\n').map((v) => v.trim()).filter(Boolean);
  for (const line of lines) {
    const matched = line.match(/^([^:：]+)\s*[:：]\s*(.+)$/);
    if (!matched) continue;
    if (!matched[1].includes('氏名')) continue;
    return matched[2].trim();
  }
  return '';
}

function extractFieldFromDescription(description: string | null | undefined, fieldName: string): string {
  if (!description) return '';
  const lines = description.split('\n').map((v) => v.trim()).filter(Boolean);
  for (const line of lines) {
    const matched = line.match(/^([^:：]+)\s*[:：]\s*(.*)$/);
    if (!matched) continue;
    if (!matched[1].includes(fieldName)) continue;
    return matched[2].trim();
  }
  return '';
}

type GoogleCalendarPanelProps = {
  onDealCreated?: () => void;
};

type SpecialEventStatus = 'pending' | 'registered' | 'failed';

export function GoogleCalendarPanel({ onDealCreated }: GoogleCalendarPanelProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
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
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [sources, setSources] = useState<MSource[]>([]);
  const [agencies, setAgencies] = useState<MAgency[]>([]);
  const [specialEventStates, setSpecialEventStates] = useState<Record<string, SpecialEventStatus>>({});
  const [specialEventDealIds, setSpecialEventDealIds] = useState<Record<string, string>>({});
  const initialized = useRef(false);
  const specialEventInFlightRef = useRef<Set<string>>(new Set());

  const setSpecialEventState = useCallback((eventId: string, status: SpecialEventStatus) => {
    setSpecialEventStates((prev) => ({ ...prev, [eventId]: status }));
  }, []);

  const autoRegisterSpecialEvents = useCallback(
    async (items: CalendarEvent[]) => {
      const specialEvents = items.filter((ev) => {
        const eventId = ev.id ?? '';
        if (!eventId) return false;
        return Boolean(ev.is_special_event ?? isSpecialCalendarEvent(ev.summary));
      });

      for (const ev of specialEvents) {
        const eventId = ev.id ?? '';
        if (!eventId) continue;
        if (specialEventStates[eventId] === 'pending' || specialEventStates[eventId] === 'registered') {
          continue;
        }
        if (specialEventInFlightRef.current.has(eventId)) {
          continue;
        }

        specialEventInFlightRef.current.add(eventId);
        setSpecialEventState(eventId, 'pending');
        try {
          const retirementDate = extractRetirementDateFromDescription(ev.description);
          const customerName = extractCustomerNameFromDescription(ev.description) || ev.summary || '';
          const ageRaw = extractFieldFromDescription(ev.description, '年齢');
          const email = extractFieldFromDescription(ev.description, 'メールアドレス');
          const phone = extractFieldFromDescription(ev.description, '電話番号');
          const res = await fetch('/api/deals/from-calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: {
                id: ev.id,
                summary: ev.summary,
                start: ev.start?.dateTime ?? ev.start?.date,
                end: ev.end?.dateTime ?? ev.end?.date,
                description: ev.description,
              },
              retirement_date: retirementDate || undefined,
              customer_name: customerName,
              deal_date: (ev.start?.dateTime ?? ev.start?.date ?? '').slice(0, 10),
              custom_data: {
                age: ageRaw ? Number(String(ageRaw).replace(/[^\d]/g, '')) || ageRaw : undefined,
                email: email || undefined,
                phone: phone || undefined,
              },
              phone: phone || undefined,
              auto_register: true,
            }),
          });
          const json = await safeReadJson(res, '/api/deals/from-calendar');

          if (res.ok && json?.deal_id) {
            setSpecialEventDealIds((prev) => ({ ...prev, [eventId]: String(json.deal_id) }));
            setSpecialEventState(eventId, 'registered');
            specialEventInFlightRef.current.delete(eventId);
            onDealCreated?.();
            continue;
          }

          if (res.status === 409 || json?.error === 'already_registered') {
            if (json?.deal_id) {
              setSpecialEventDealIds((prev) => ({ ...prev, [eventId]: String(json.deal_id) }));
            }
            setSpecialEventState(eventId, 'registered');
            specialEventInFlightRef.current.delete(eventId);
            continue;
          }

          console.warn('[GoogleCalendarPanel] auto register rejected:', {
            eventId,
            status: res.status,
            error: json?.error,
            message: json?.message,
            field_errors: json?.field_errors,
          });
          setSpecialEventState(eventId, 'failed');
          specialEventInFlightRef.current.delete(eventId);
        } catch (e) {
          console.error('[GoogleCalendarPanel] auto register failed:', e);
          setSpecialEventState(eventId, 'failed');
          specialEventInFlightRef.current.delete(eventId);
        }
      }
    },
    [onDealCreated, specialEventStates, setSpecialEventState]
  );

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
      const json = await safeReadJson(res, '/api/google/calendar/events');

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
      const nextEvents = (json.items ?? []) as CalendarEvent[];
      setEvents(nextEvents);
      void autoRegisterSpecialEvents(nextEvents);
    } catch (e) {
      setIcalConfigured(false);
      setError(e instanceof Error ? e.message : 'calendar_fetch_failed');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [autoRegisterSpecialEvents]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getSources(true);
      if (cancelled) return;
      setSources(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getAgencies(true);
      if (cancelled) return;
      setAgencies(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const json = await safeReadJson(res, '/api/user/ical-url');
      if (!res.ok) {
        setSaveError(json?.error ?? '保存に失敗しました');
        return;
      }
      setShowForm(false);
      setInputUrl('');
      setRegisterError(null);
      setRegisterSuccess(null);
      setSpecialEventStates({});
      setSpecialEventDealIds({});
      specialEventInFlightRef.current.clear();
      void fetchEvents();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCalendarRegister = async (updatedFields: DealAutoFields) => {
    // UpdatedFields contains the possibly edited auto‑filled data.
    if (!selectedEvent?.id) return;
    const validation = validateCalendarDealInput(
      {
        customer_name: updatedFields.顧客名,
        assigned_to: updatedFields.担当者,
        retirement_date: updatedFields.退職予定日,
        deal_date: updatedFields.商談日,
        age: updatedFields.年齢,
        email: updatedFields.メールアドレス,
        source: updatedFields.流入経路,
        referrer: updatedFields.紹介者,
        phone: updatedFields.電話番号,
      },
      {
        sourceCodes: sources.map((s) => s.code),
        agencyCodes: agencies.map((a) => a.code),
      }
    );
    if (!validation.isValid) {
      const message = Object.values(validation.errors).find(Boolean) ?? '必須項目を入力してください';
      setRegisterError(message);
      throw new Error(message);
    }
    setRegisterError(null);
    setRegisterSuccess(null);
    try {
      const normalized = validation.normalized;
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
          // Use the possibly edited retirement date from the modal
          retirement_date: normalized.retirement_date,
          customer_name: normalized.customer_name,
          assigned_to: normalized.assigned_to,
          deal_date: normalized.deal_date,
          source: normalized.source,
          agency_code: normalized.referrer,
          custom_data: {
            ...(customData ?? {}),
            age: normalized.age ? Number(String(normalized.age).replace(/[^\d]/g, '')) || normalized.age : undefined,
            email: normalized.email || undefined,
            phone: normalized.phone || undefined,
          },
          phone: normalized.phone || undefined,
        }),
      });
      const json = await safeReadJson(res, '/api/deals/from-calendar');
      if (!res.ok) {
        const message = json?.message ?? json?.error ?? '登録に失敗しました';
        setRegisterError(message);
        throw new Error(message);
      }
      // Optimistically update UI without requiring a reload.
      const eventId = selectedEvent.id;
      if (eventId) {
        setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      }
      setSelectedEvent(null);
      setRetirementDate('');
      setCustomData({});
      setRegisterSuccess('商談を追加しました');
      void fetchEvents();
      onDealCreated?.();
      return;
    } catch (e) {
      const message = e instanceof Error ? e.message : '登録に失敗しました';
      setRegisterError((prev) => prev ?? message);
      throw e;
    }
  };
  const handleDisconnect = async () => {
    await fetch('/api/user/ical-url', { method: 'DELETE' });
    setIcalConfigured(false);
    setEvents([]);
    setSelectedEvent(null);
    setRegisterError(null);
    setRegisterSuccess(null);
    setSpecialEventStates({});
    setSpecialEventDealIds({});
    specialEventInFlightRef.current.clear();
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
      {registerSuccess && (
        <div className="mx-4 sm:mx-6 my-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
          {registerSuccess}
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
            const special = Boolean(ev.is_special_event ?? isSpecialCalendarEvent(ev.summary));
            const eventId = ev.id ?? '';
            const autoStatus = eventId ? specialEventStates[eventId] : undefined;
            const dealId = eventId ? specialEventDealIds[eventId] : undefined;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (special && dealId) {
                    router.push(`/deals/${dealId}`);
                    return;
                  }
                  setSelectedEvent(ev);
                  setRetirementDate(extractRetirementDateFromDescription(ev.description));
                  setRegisterError(null);
                  setRegisterSuccess(null);
                  const ageRaw = extractFieldFromDescription(ev.description, '年齢');
                  const email = extractFieldFromDescription(ev.description, 'メールアドレス');
                  const phone = extractFieldFromDescription(ev.description, '電話番号');
                  const ageNum = ageRaw ? Number(String(ageRaw).replace(/[^\d]/g, '')) : NaN;
                  setCustomData({
                    age: Number.isFinite(ageNum) ? ageNum : ageRaw,
                    email,
                    phone,
                  });
                }}
                className="w-full text-left px-4 sm:px-6 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isToday ? 'bg-green-400' : 'bg-blue-300'}`}
                />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ev.summary ?? '（タイトルなし）'}</p>
                    {special && autoStatus === 'pending' && (
                      <span className="inline-flex flex-shrink-0 items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        自動登録中
                      </span>
                    )}
                    {special && autoStatus === 'registered' && (
                      <span className="inline-flex flex-shrink-0 items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        商談登録済み
                      </span>
                    )}
                    {special && autoStatus === 'failed' && (
                      <span className="inline-flex flex-shrink-0 items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        自動登録失敗
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{formatStart(ev)}</p>
                </div>
                {ev.htmlLink && !special && (
                  <span className="text-xs text-blue-600 whitespace-nowrap flex-shrink-0">クリックで商談化</span>
                )}
              </button>
            );
          })}
        {selectedEvent && (
          <DealRegisterModal
            isOpen={true}
            onClose={() => {
              setSelectedEvent(null);
              setRegisterError(null);
            }}
            eventDetails={{
              タイトル: selectedEvent.summary ?? '',
              説明: selectedEvent.description ?? '',
              開始: formatDateTimeJst(selectedEvent.start?.dateTime ?? selectedEvent.start?.date ?? ''),
              終了: formatDateTimeJst(selectedEvent.end?.dateTime ?? selectedEvent.end?.date ?? ''),
            }}
            autoFields={{
              顧客名: extractCustomerNameFromDescription(selectedEvent.description) || (selectedEvent.summary ?? ''),
              担当者: currentUser.name,
              退職予定日: retirementDate,
              商談日: (selectedEvent.start?.dateTime ?? selectedEvent.start?.date ?? '').slice(0, 10),
              年齢: extractFieldFromDescription(selectedEvent.description, '年齢'),
              メールアドレス: extractFieldFromDescription(selectedEvent.description, 'メールアドレス'),
              電話番号: extractFieldFromDescription(selectedEvent.description, '電話番号'),
              流入経路: '',
              紹介者: '',
            }}
            sources={sources.map((s) => ({ code: s.code, name: s.name }))}
            agencies={agencies.map((a) => ({ code: a.code, name: a.name }))}
            onConfirm={handleCalendarRegister}
          />
        )}
      </div>
    </div>
  );
}
