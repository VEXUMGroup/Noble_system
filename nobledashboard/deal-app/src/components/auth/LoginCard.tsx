'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-auth/client';

interface LoginCardProps {
  configMissing: boolean;
  errorMessage?: string | null;
}

export function LoginCard({
  configMissing,
  errorMessage = null,
}: LoginCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(errorMessage);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setLocalError(null);

      const supabase = createBrowserSupabaseClient();
      const redirectTo = resolveAuthCallbackUrl();
      redirectTo.searchParams.set('next', '/dashboard');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo.toString(),
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error('Googleログインの遷移先URLを取得できませんでした。');
      }

      window.location.assign(data.url);
    } catch (error) {
      const message = getOAuthErrorMessage(error);

      setLocalError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-600 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">商</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            商談管理システム
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            社会保険給付金サポート業務
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 font-medium mb-1">
              Googleアカウントでログイン
            </p>
            <p className="text-xs text-gray-500">
              Supabase Auth経由で認証し、`m_users` に登録済みのユーザーのみ利用できます。
            </p>
          </div>

          {localError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
              {localError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={configMissing || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 text-base"
          >
            {isLoading ? 'Googleへ移動しています...' : 'Googleでログイン'}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            ログインには `m_users` に登録済みのメールアドレスが必要です。
          </p>
        </div>
      </div>
    </div>
  );
}

function resolveAuthCallbackUrl() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const baseUrl = configuredAppUrl || window.location.origin;
  return new URL('/auth/callback', baseUrl);
}

function getOAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Googleログインを開始できませんでした。';
  }

  if (error.message.includes('provider is not enabled')) {
    return 'Supabase で Google Provider が有効化されていません。Auth の Google 設定を有効化してください。';
  }

  if (error.message.includes('redirect')) {
    return 'OAuth のリダイレクトURL設定に問題があります。Supabase の許可済み URL を確認してください。';
  }

  return error.message;
}
