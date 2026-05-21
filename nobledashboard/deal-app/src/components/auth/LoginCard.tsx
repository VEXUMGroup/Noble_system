'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized_user:
    '営業者マスタに存在しないか、無効化されているためログインできません。',
  oauth_exchange_failed: 'ログインのセッション交換に失敗しました。',
  otp_send_failed: 'ログイン用メールの送信に失敗しました。',
  otp_verify_failed: 'ログイン用リンクの検証に失敗しました。',
  member_link_failed: '営業者アカウントとの紐付けに失敗しました。',
  member_already_linked: 'この営業者は別の認証アカウントに紐づいています。',
  missing_user_email: 'ログインに必要なメールアドレスを取得できませんでした。',
  missing_supabase_env: 'Supabaseの環境変数が不足しています。',
  missing_auth_secret: 'ログイン用セッションの秘密鍵(APP_AUTH_SECRET)が不足しています。',
  missing_callback_params: 'ログインに必要な情報が不足しています。',
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
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');

  const handleEmailLogin = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        setError('メールアドレスを入力してください。');
        return;
      }

      // SupabaseのOTPメールは使わず、m_usersに存在するかで即時ログインする
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? 'ログインに失敗しました。');
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (caughtError) {
      if (isAuthDebugEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[auth-debug] email_login_throw', {
          error:
            caughtError instanceof Error
              ? { name: caughtError.name, message: caughtError.message }
              : caughtError,
        });
      }
      setError(caughtError instanceof Error ? caughtError.message : 'ログインに失敗しました。');
    } finally {
      setSubmitting(false);
    }
  }, [email, nextPath, router]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-600 mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">商</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">商談管理システム</h1>
        <p className="text-sm text-gray-500 mb-8">社会保険給付金サポート業務</p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-600 font-medium mb-1">メールアドレスでログイン</p>
          <p className="text-xs text-gray-500">
            `m_users` に登録済みかつ有効なメールアドレスのみログインできます。
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
            {ERROR_MESSAGES[error] ?? error}
          </div>
        )}

        <label className="block text-left text-sm font-medium text-gray-700 mb-2" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={submitting}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="you@example.com"
        />

        <button
          onClick={handleEmailLogin}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 text-base"
        >
          {submitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </div>
    </div>
  );
}
