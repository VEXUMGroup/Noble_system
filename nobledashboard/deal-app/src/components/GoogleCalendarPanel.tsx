'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type CalendarEvent = {
  id?: string | null;
  summary?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  htmlLink?: string | null;
};

export function GoogleCalendarPanel() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const connect = useCallback(async () => {
    setError(null);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    if (!appUrl) {
      setError('NEXT_PUBLIC_APP_URL is missing');
      return;
    }

    const redirectTo = `${appUrl}/auth/callback`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (signInError) setError(signInError.message);
  }, [supabase]);

  const disconnect = useCallback(async () => {
    setError(null);
    setDisconnecting(true);
    try {
      const res = await fetch('/api/google/calendar/connection', {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json?.error ?? 'google_disconnect_failed');
        return;
      }

      setEvents([]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'google_disconnect_failed');
    } finally {
      setDisconnecting(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setSigningOut(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    setSigningOut(false);
  }, [supabase]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/google/calendar/events', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? 'failed');
        setEvents([]);
        return;
      }
      setEvents(json.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Googleカレンダー連携</h2>
          <p className="text-sm text-gray-500">自分のGoogle予定（primary）をサーバー側API経由で取得します</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={connect}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            Google連携
          </button>
          <button
            onClick={disconnect}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium"
            disabled={disconnecting}
          >
            {disconnecting ? '解除中...' : '連携解除'}
          </button>
          <button
            onClick={signOut}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium"
            disabled={signingOut}
          >
            {signingOut ? 'ログアウト中...' : 'アプリをログアウト'}
          </button>
          <button
            onClick={fetchEvents}
            className="px-3 py-2 rounded-lg bg-white border hover:bg-gray-50 text-gray-800 text-sm font-medium"
            disabled={loading}
          >
            予定再取得
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          {error === 'google_not_connected'
            ? 'Google連携がありません。Google連携を実行してください。'
            : error === 'google_refresh_not_configured'
              ? 'Google token更新用のサーバー環境変数が不足しています。'
              : error === 'unauthorized_user'
                ? '営業者マスタに紐づいていないため予定を取得できません。'
            : `Error: ${error}`}
        </div>
      )}

      <div className="text-sm text-gray-700">
        {loading ? (
          <div>取得中...</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500">予定がありません（または未連携）</div>
        ) : (
          <ul className="divide-y">
            {events.map((ev, idx) => {
              const start = ev.start?.dateTime ?? ev.start?.date ?? '';
              const key = ev.id ?? `${start}-${idx}`;
              return (
                <li key={key} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{ev.summary ?? '(no title)'}</div>
                    <div className="text-xs text-gray-500 truncate">{start}</div>
                  </div>
                  {ev.htmlLink && (
                    <a
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
                    >
                      開く
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
