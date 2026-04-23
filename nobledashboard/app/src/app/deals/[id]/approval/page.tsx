'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INTERVIEW_STATUS_CONFIG,
  RESULT_STATUS_CONFIG,
} from '@/lib/types';
import {
  mockDeals,
  mockUsers,
  mockPlans,
  mockSources,
  mockAgencies,
  getUserName,
  getSourceName,
  formatCurrency,
  formatDate,
  type Deal,
} from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ApprovalPageProps {
  params: {
    id: string;
  };
}

export default function ApprovalPage({ params }: ApprovalPageProps) {
  const router = useRouter();
  const deal = mockDeals.find((d) => d.id === params.id);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">404</h1>
            <p className="text-gray-600">申し訳ございません。該当する商談が見つかりません。</p>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    setSuccessMessage('承認が完了しました。締結工程へ進行できます。');
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${params.id}`);
    }, 1500);
  };

  const handleReject = () => {
    if (!rejectComment.trim()) {
      alert('コメントを入力してください');
      return;
    }
    setSuccessMessage('差し戻しました。営業担当へ通知しました。');
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${params.id}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">事務承認</h1>
        <p className="text-sm text-gray-600 mt-2">ID: {deal.id}</p>
      </div>

      {/* Deal Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
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
            <p className="text-sm text-gray-600 mb-1">商談月</p>
            <p className="text-gray-900 font-medium">{deal.deal_month}</p>
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
          {deal.referrer && (
            <div>
              <p className="text-sm text-gray-600 mb-1">紹介者</p>
              <p className="text-gray-900 font-medium">{deal.referrer}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contract Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">成約情報</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">提案内容</p>
            <p className="text-gray-900 font-medium">{deal.proposal_content || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">成約金額</p>
            <p className="text-gray-900 font-medium">{formatCurrency(deal.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">面談ステータス</p>
            <StatusBadge status={deal.interview_status} type="interview" />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">結果ステータス</p>
            {deal.result_status ? (
              <StatusBadge status={deal.result_status} type="result" />
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Approval Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">承認操作</h2>

        {!showRejectForm ? (
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              承認
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
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
    </div>
  );
}
