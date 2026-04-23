'use client';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleSSOLogin = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-full bg-blue-600 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">商</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            商談管理システム
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            社会保険給付金サポート業務
          </p>

          {/* SSO Info Box */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">
              SSO認証（OAuth 2.0 / OpenID Connect）
            </p>
            <p className="text-xs text-gray-400">
              対象: 全ロール（営業・事務・管理）
            </p>
          </div>

          {/* SSO Login Button */}
          <button
            onClick={handleSSOLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 text-base"
          >
            SSOでログイン
          </button>

          {/* Token Info */}
          <p className="text-xs text-gray-400 mt-4">
            トークン有効期限: アクセス1時間 / リフレッシュ7日間
          </p>
        </div>
      </div>
    </div>
  );
}
