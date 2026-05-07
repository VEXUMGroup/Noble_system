'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getUserName,
  getPlanName,
  getAgencyName,
  getSourceName,
  formatCurrency,
  formatDate,
} from '@/lib/mock-data';
import { getDeal, updateDeal, type DealRow } from '@/lib/supabase';

interface ApprovalPageProps {
  params: {
    id: string;
  };
}

export default function ApprovalPage({ params }: ApprovalPageProps) {
  const router = useRouter();
  const [deal, setDeal] = useState<DealRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const row = await getDeal(params.id);
      if (cancelled) return;
      setDeal(row);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  if (isLoading) {
    return <div className="bg-white rounded-xl shadow-sm p-8"><p className="text-gray-500">読み込み中…</p></div>;
  }

  if (!deal) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-5xl mb-4">404</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">商談が見つかりません</h1>
          <p className="text-gray-500">該当する商談データが存在しないか、削除された可能性があります。</p>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    const { data, error } = await updateDeal(deal.id, { status: 'APPROVED' });
    if (!data) {
      setErrorMessage(`承認に失敗しました：${error ?? '不明'}`);
      return;
    }
    setSuccessMessage('承認が完了しました。締結工程へ進行できます。');
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${params.id}`);
    }, 1500);
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      alert('差し戻しコメントを入力してください');
      return;
    }
    const { data, error } = await updateDeal(deal.id, {
      status: 'CONTRACTED',
      memo: rejectComment.trim(),
    });
    if (!data) {
      setErrorMessage(`差し戻しに失敗しました：${error ?? '不明'}`);
      return;
    }
    setSuccessMessage('「成約」ステータスに差し戻しました。');
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${params.id}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/deals/${params.id}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        商談詳細に戻る
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">事務承認</h1>
        <p className="text-sm text-gray-500 mt-1">ID: {deal.id} / {deal.customer_name}</p>
      </div>

      {/* 仕様書 5.4: 案件の全情報を読み取り専用で表示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          この画面では成約情報を確認し、承認または差し戻しを行います。情報に過不足がある場合はコメント付きで差し戻してください。
        </p>
      </div>

      {/* Deal Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4">商談情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">顧客名</p>
            <p className="text-gray-900 font-medium">{deal.customer_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">担当</p>
            <p className="text-gray-900 font-medium">{getUserName(deal.assigned_to)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">商談日</p>
            <p className="text-gray-900 font-medium">{formatDate(deal.deal_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">流入経路</p>
            <p className="text-gray-900 font-medium">{getSourceName(deal.source)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">退職予定日</p>
            <p className="text-gray-900 font-medium">{formatDate(deal.retirement_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">代理店</p>
            <p className="text-gray-900 font-medium">{getAgencyName(deal.agency_code)}</p>
          </div>
        </div>
      </div>

      {/* Contract Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4">成約情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">成約プラン</p>
            <p className="text-gray-900 font-medium">{getPlanName(deal.plan_code)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">金額</p>
            <p className="text-gray-900 font-medium">{formatCurrency(deal.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">支払方法</p>
            <p className="text-gray-900 font-medium">{deal.payment_method || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">支払期限</p>
            <p className="text-gray-900 font-medium">{formatDate(deal.payment_deadline)}</p>
          </div>
        </div>
      </div>

      {/* Approval Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4">承認操作</h2>

        {!showRejectForm ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleApprove}
              className="flex-1 sm:flex-none px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              承認
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              className="flex-1 sm:flex-none px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              差し戻し
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                差し戻しコメント
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="差し戻し理由を入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                送信
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectComment('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-sm">
            <p className="text-lg font-bold text-gray-800">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
