'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  STATUS_CONFIG,
  VALID_TRANSITIONS,
  INTERVIEW_STATUS_CONFIG,
  RESULT_STATUS_CONFIG,
  CONTRACT_CONFIRM_CONFIG,
  type DealStatus,
  type InterviewStatus,
  type ResultStatus,
} from '@/lib/types';
import {
  mockDeals,
  mockUsers,
  mockPlans,
  mockSources,
  mockAgencies,
  mockNotifications,
  getUserName,
  getPlanName,
  getAgencyName,
  getSourceName,
  formatCurrency,
  formatDate,
  getDaysUntil,
  currentUser,
  type Deal,
  type Plan,
  type Source,
  type Agency,
} from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusTimeline } from '@/components/ui/StatusTimeline';

interface DealDetailPageProps {
  params: {
    id: string;
  };
}

export default function DealDetailPage({ params }: DealDetailPageProps) {
  const router = useRouter();
  const deal = mockDeals.find((d) => d.id === params.id);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ResultStatus | null>(null);

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

  const iConfig = INTERVIEW_STATUS_CONFIG[deal.interview_status];
  const rConfig = deal.result_status ? RESULT_STATUS_CONFIG[deal.result_status] : null;

  const handleResultChange = (newStatus: ResultStatus) => {
    if (newStatus === 'OUT_OF_SCOPE') {
      setPendingStatus(newStatus);
      setShowConfirm(true);
    } else {
      // In real app, would update deal result_status
      setShowConfirm(false);
      setPendingStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">ID: {deal.id}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{deal.customer_name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={deal.interview_status} type="interview" />
          {deal.result_status && (
            <StatusBadge status={deal.result_status} type="result" />
          )}
        </div>
      </div>

      {/* ステータス変更履歴 */}
      <StatusTimeline history={deal.status_history} />

      {/* 基本情報 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">基本情報</h2>
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
          {deal.agency_type && (
            <div>
              <p className="text-sm text-gray-600 mb-1">代理店区分</p>
              <p className="text-gray-900 font-medium">{deal.agency_type}</p>
            </div>
          )}
          {deal.prospect_level && (
            <div>
              <p className="text-sm text-gray-600 mb-1">見込み度</p>
              <p className="text-gray-900 font-medium">{deal.prospect_level}</p>
            </div>
          )}
          {deal.next_action_date && (
            <div>
              <p className="text-sm text-gray-600 mb-1">次回アクション日</p>
              <p className="text-gray-900 font-medium">{formatDate(deal.next_action_date)}</p>
            </div>
          )}
          {deal.deal_notes && (
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-600 mb-1">商談内容メモ</p>
              <p className="text-gray-900">{deal.deal_notes}</p>
            </div>
          )}
          {deal.remarks && (
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-600 mb-1">備考</p>
              <p className="text-gray-900">{deal.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* 成約情報 */}
      {(deal.proposal_content || deal.amount) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">成約情報</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {deal.proposal_content && (
              <div>
                <p className="text-sm text-gray-600 mb-1">提案内容</p>
                <p className="text-gray-900 font-medium">{deal.proposal_content}</p>
              </div>
            )}
            {deal.amount && (
              <div>
                <p className="text-sm text-gray-600 mb-1">成約金額</p>
                <p className="text-gray-900 font-medium">{formatCurrency(deal.amount)}</p>
              </div>
            )}
            {deal.contract_confirm && (
              <div>
                <p className="text-sm text-gray-600 mb-1">契約書締結確認</p>
                <StatusBadge status={deal.contract_confirm} type="contractConfirm" />
              </div>
            )}
            {deal.contract_date && (
              <div>
                <p className="text-sm text-gray-600 mb-1">締結日</p>
                <p className="text-gray-900 font-medium">{formatDate(deal.contract_date)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 人材提案 */}
      {(deal.hr_proposal || deal.hr_feasibility) && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">人材提案</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {deal.hr_proposal && (
              <div>
                <p className="text-sm text-gray-600 mb-1">人材提案</p>
                <p className="text-gray-900 font-medium">{deal.hr_proposal}</p>
              </div>
            )}
            {deal.hr_feasibility && (
              <div>
                <p className="text-sm text-gray-600 mb-1">人材可否</p>
                <p className="text-gray-900 font-medium">{deal.hr_feasibility}</p>
              </div>
            )}
            {deal.hr_reason && (
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-600 mb-1">可否理由</p>
                <p className="text-gray-900">{deal.hr_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 録画 */}
      {deal.recording_url && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">レコ（動画）</h2>
          <a
            href={deal.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {deal.recording_url}
          </a>
        </div>
      )}

      {/* ステータス操作 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">ステータス操作</h2>
        <div className="flex flex-wrap gap-3">
          {/* 面談実施済みで結果未設定の場合 */}
          {deal.interview_status === 'INTERVIEW_DONE' && !deal.result_status && (
            <>
              <button
                onClick={() => handleResultChange('CONTRACTED')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                成約
              </button>
              <button
                onClick={() => handleResultChange('CONSIDERING')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                検討
              </button>
              <button
                onClick={() => {
                  setPendingStatus('OUT_OF_SCOPE');
                  setShowConfirm(true);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
              >
                対象外
              </button>
            </>
          )}

          {/* 検討中 → 成約 or 対象外 */}
          {deal.result_status === 'CONSIDERING' && (
            <>
              <button
                onClick={() => handleResultChange('CONTRACTED')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                成約へ変更
              </button>
              <button
                onClick={() => {
                  setPendingStatus('OUT_OF_SCOPE');
                  setShowConfirm(true);
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
              >
                対象外へ変更
              </button>
            </>
          )}

          {/* 成約済み → 詳細入力へ (legacy flow) */}
          {deal.result_status === 'CONTRACTED' && deal.status === 'CONTRACTED' && (
            <Link
              href={`/deals/${params.id}/contract-detail`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-block"
            >
              詳細入力へ進む
            </Link>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h2 className="text-lg font-bold mb-4">
              対象外に変更しますか?
            </h2>
            <p className="text-gray-600 mb-6">
              この操作は取り消せません。よろしいですか?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setPendingStatus(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setPendingStatus(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
