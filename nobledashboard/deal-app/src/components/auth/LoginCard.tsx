'use client';

import { useCallback, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const GOOGLE_CALENDAR_SCOPES =
  'openid email profile https://www.googleapis.com/auth/calendar.readonly';

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized_user:
    '営業者マスタに存在しないか、無効化されているためログインできません。',
  oauth_exchange_failed: 'Googleログインのセッション交換に失敗しました。',
  missing_google_refresh_token:
    'Googleのrefresh tokenを取得できませんでした。Google連携設定を見直してください。',
  member_link_failed: '営業者アカウントとの紐付けに失敗しました。',
  google_account_save_failed: 'Google連携情報の保存に失敗しました。',
  member_already_linked: 'この営業者は別の認証アカウントに紐づいています。',
  missing_user_email: 'ログインに必要なメールアドレスを取得できませんでした。',
  missing_supabase_env: 'Supabaseの環境変数が不足しています。',
};

type LoginCardProps = {
  initialError?: string | null;
  nextPath?: string;
};

function buildRedirectUrl(nextPath: string) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is missing');
  }

  const redirectUrl = new URL('/auth/callback', appUrl);
  redirectUrl.searchParams.set('next', nextPath);
  return redirectUrl.toString();
}

function isAuthDebugEnabled() {
  return process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true';
}

export function LoginCard({
  initialError = null,
  nextPath = '/dashboard',
}: LoginCardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleLogin = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      const redirectTo = buildRedirectUrl(nextPath);
      if (isAuthDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[auth-debug] start_oauth', {
          nextPath,
          redirectTo,
          appUrlEnv: process.env.NEXT_PUBLIC_APP_URL ?? null,
          locationOrigin: typeof window !== 'undefined' ? window.location.origin : null,
        });
      }
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: GOOGLE_CALENDAR_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (signInError) {
        if (isAuthDebugEnabled()) {
          // eslint-disable-next-line no-console
          console.info('[auth-debug] signInWithOAuth_error', {
            message: signInError.message,
            name: signInError.name,
            status: (signInError as unknown as { status?: number }).status,
          });
        }
        setError(signInError.message);
      }
    } catch (caughtError) {
      if (isAuthDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[auth-debug] signInWithOAuth_throw', {
          error:
            caughtError instanceof Error
              ? { name: caughtError.name, message: caughtError.message }
              : caughtError,
        });
      }
      setError(caughtError instanceof Error ? caughtError.message : 'Googleログインに失敗しました。');
    } finally {
      setSubmitting(false);
    }
  }, [nextPath, supabase]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-600 mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">商</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">商談管理システム</h1>
        <p className="text-sm text-gray-500 mb-8">社会保険給付金サポート業務</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-600 font-medium mb-1">Googleログイン + Googleカレンダー連携</p>
          <p className="text-xs text-gray-500">
            営業者マスタに登録済みかつ有効なメールアドレスのみログインできます。
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
            {ERROR_MESSAGES[error] ?? error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 text-base"
        >
          {submitting ? 'Googleへ遷移中...' : 'Googleでログイン'}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          カレンダー取得には `calendar.readonly` と offline access を要求します。
        </p>
      </div>
    </div>
  );
}
