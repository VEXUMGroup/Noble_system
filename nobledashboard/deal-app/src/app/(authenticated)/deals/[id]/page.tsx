'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  STATUS_CONFIG,
  VALID_TRANSITIONS,
  type DealStatus,
} from '@/lib/types';
import {
  mockDeals,
  getUserName,
  getPlanName,
  getAgencyName,
  getSourceName,
  formatCurrency,
  formatDate,
  getDaysUntil,
} from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Mock status history
interface StatusHistory {
  id: string;
  status: string;
  changed_by: string;
  changed_at: string;
  comment?: string;
}

function getMockHistory(dealId: string): StatusHistory[] {
  const deal = mockDeals.find((d) => d.id === dealId);
  if (!deal) return [];

  const history: StatusHistory[] = [
    {
      id: '1',
      status: 'NEW',
      changed_by: 'システム',
      changed_at: deal.created_at,
      comment: 'Googleカレンダーから自動取得',
    },
  ];

  const statusOrder: DealStatus[] = [
    'NEW', 'INTERVIEWED', 'CONTRACTED', 'CONSIDERING',
    'DETAIL_ENTERED', 'APPROVED', 'CONTRACT_SIGNED',
    'PAYMENT_MANAGING', 'COMPLETED',
  ];

  const currentIdx = statusOrder.indexOf(deal.status as DealStatus);
  if (currentIdx > 0 && deal.status !== 'CONSIDERING') {
    const progression = statusOrder.slice(1, currentIdx + 1).filter((s) => s !== 'CONSIDERING');
    const baseDate = new Date(deal.created_at);
    progression.forEach((status, i) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + (i + 1) * 3);
      history.push({
        id: String(i + 2),
        status,
        changed_by: getUserName(deal.assigned_to),
        changed_at: date.toISOString(),
      });
    });
  } else if (deal.status === 'CONSIDERING') {
    history.push({
      id: '2',
      status: 'INTERVIEWED',
      changed_by: getUserName(deal.assigned_to),
      changed_at: new Date(new Date(deal.created_at).getTime() + 3 * 86400000).toISOString(),
    });
    history.push({
      id: '3',
      status: 'CONSIDERING',
      changed_by: getUserName(deal.assigned_to),
      changed_at: new Date(new Date(deal.created_at).getTime() + 6 * 86400000).toISOString(),
      comment: deal.memo || undefined,
    });
  } else if (deal.status === 'INTERVIEWED') {
    history.push({
      id: '2',
      status: 'INTERVIEWED',
      changed_by: getUserName(deal.assigned_to),
      changed_at: new Date(new Date(deal.created_at).getTime() + 3 * 86400000).toISOString(),
    });
  }

  return history;
}

interface DealDetailPageProps {
  params: {
    id: string;
  };
}

export default function DealDetailPage({ params }: DealDetailPageProps) {
  const router = useRouter();
  const originalDeal = mockDeals.find((d) => d.id === params.id);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<DealStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<DealStatus | null>(
    originalDeal?.status ?? null
  );
  const [statusMessage, setStatusMessage] = useState('');

  const deal = originalDeal && currentStatus
    ? { ...originalDeal, status: currentStatus }
    : originalDeal;

  if (!deal) {
    return (
      <div className="space-y-6">
        <Link href="/deals" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </Link>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-5xl mb-4">404</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">商談が見つかりません</h1>
          <p className="text-gray-500">該当する商談データが存在しないか、削除された可能性があります。</p>
        </div>
      </div>
    );
  }

  const validTransitions = VALID_TRANSITIONS[deal.status as DealStatus] || [];
  const statusHistory = getMockHistory(deal.id);

  const handleContracted = () => {
    if (originalDeal) {
      originalDeal.status = 'CONTRACTED';
      originalDeal.updated_at = new Date().toISOString();
    }
    router.push(`/deals/${params.id}/contract-detail`);
  };
  const handleConsidering = () => {
    if (originalDeal) {
      originalDeal.status = 'CONSIDERING';
      originalDeal.updated_at = new Date().toISOString();
    }
    router.push('/review');
  };
  const handleOutOfScope = () => {
    setPendingStatus('OUT_OF_SCOPE');
    setShowConfirm(true);
  };
  const confirmOutOfScope = () => {
    setShowConfirm(false);
    setPendingStatus(null);
    if (originalDeal) {
      originalDeal.status = 'OUT_OF_SCOPE';
      originalDeal.updated_at = new Date().toISOString();
    }
    router.push('/deals');
  };
  const handleStatusChange = (newStatus: DealStatus) => {
    if (!originalDeal) return;

    setCurrentStatus(newStatus);
    setStatusMessage(
      newStatus === 'PAYMENT_MANAGING'
        ? 'ステータスを「支払管理中」に更新し、支払管理画面へ移動します。'
        : `ステータスを「${STATUS_CONFIG[newStatus].label}」に更新しました。`
    );
    originalDeal.status = newStatus;
    originalDeal.updated_at = new Date().toISOString();

    if (newStatus === 'PAYMENT_MANAGING') {
      router.push('/payments');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - matches wireframe ScreenHeader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-blue-600 pb-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            {deal.id} {deal.customer_name} 様 <StatusBadge status={deal.status} />
          </h1>
          <p className="text-xs text-gray-500 mt-1">案件の詳細情報表示・編集｜対象: 全ロール（操作はロール別）</p>
        </div>
        <Link
          href="/deals"
          className="self-start px-4 py-2 border border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium transition"
        >
          一覧に戻る
        </Link>
      </div>

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{statusMessage}</p>
        </div>
      )}

      {/* 2-Column Layout: 2fr 1fr */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2fr) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold mb-4 pb-2 border-b border-gray-100">基本情報（営業は編集可）</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">お客様氏名</p>
                <p className="text-sm font-medium text-gray-900">{deal.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">担当</p>
                <p className="text-sm font-medium text-gray-900">{getUserName(deal.assigned_to)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">商談日</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(deal.deal_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">流入経路</p>
                <p className="text-sm font-medium text-gray-900">{getSourceName(deal.source)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">退職予定日</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(deal.retirement_date)}
                  {deal.status === 'CONSIDERING' && getDaysUntil(deal.retirement_date) <= 14 && (
                    <span className="ml-2 text-red-600 text-xs font-bold">
                      ({getDaysUntil(deal.retirement_date)}日後)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">紹介者（代理店経由）</p>
                <p className="text-sm font-medium text-gray-900">{deal.referrer || getAgencyName(deal.agency_code)}</p>
              </div>
              {deal.memo && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">メモ</p>
                  <p className="text-sm text-gray-900">{deal.memo}</p>
                </div>
              )}
            </div>
          </div>

          {/* 成約情報 */}
          {(deal.plan_code || deal.amount) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-bold mb-4 pb-2 border-b border-gray-100">成約情報</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {deal.plan_code && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">プラン</p>
                    <p className="text-sm font-medium text-gray-900">{getPlanName(deal.plan_code)}</p>
                  </div>
                )}
                {deal.amount != null && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">金額</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(deal.amount)}</p>
                  </div>
                )}
                {deal.payment_method && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">支払方法</p>
                    <p className="text-sm font-medium text-gray-900">{deal.payment_method === 'stripe' ? 'Stripe決済' : '振り込み'}</p>
                  </div>
                )}
                {deal.payment_deadline && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">支払期限</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(deal.payment_deadline)}</p>
                  </div>
                )}
                {deal.payment_plan && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">支払いプラン</p>
                    <p className="text-sm font-medium text-gray-900">{deal.payment_plan}</p>
                  </div>
                )}
                {deal.proposal_content && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">提案内容</p>
                    <p className="text-sm font-medium text-gray-900">{deal.proposal_content}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 締結情報 */}
          {(deal.address || deal.contract_date) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-bold mb-4 pb-2 border-b border-gray-100">締結情報</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {deal.address && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">住所</p>
                    <p className="text-sm font-medium text-gray-900">{deal.address}</p>
                  </div>
                )}
                {deal.contract_date && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">締結日</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(deal.contract_date)}</p>
                  </div>
                )}
                {deal.contract_confirmation && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">契約書締結確認</p>
                    <p className="text-sm font-medium text-gray-900">{deal.contract_confirmation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 履歴 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold mb-4 pb-2 border-b border-gray-100">ステータス変更履歴・担当メモ（時系列）</h2>
            <div className="space-y-0">
              {statusHistory.map((entry, index) => {
                const config = STATUS_CONFIG[entry.status];
                return (
                  <div key={entry.id} className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-3 py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-400 whitespace-nowrap">
                      {formatDate(entry.changed_at.split('T')[0])}
                    </span>
                    <span className="text-blue-600 font-semibold whitespace-nowrap">{entry.changed_by}</span>
                    <span className="text-gray-900">
                      {config ? config.label : entry.status}
                      {entry.comment && ` — ${entry.comment}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar (1fr) */}
        <div className="space-y-6">
          {/* ステータス操作 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold mb-3 pb-2 border-b border-gray-100">ステータス操作</h2>
            <p className="text-xs text-gray-400 mb-4">現在のステータスに応じたアクションボタンを動的表示</p>

            {validTransitions.length > 0 ? (
              <div className="space-y-3">
                {/* INTERVIEWED → 成約/検討/対象外 */}
                {deal.status === 'INTERVIEWED' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-blue-600 mb-3">面談済の場合</p>
                    <div className="flex flex-col gap-2">
                      <button onClick={handleContracted} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition">
                        成約
                      </button>
                      <button onClick={handleConsidering} className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm transition">
                        検討
                      </button>
                      <button onClick={handleOutOfScope} className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium text-sm transition">
                        対象外
                      </button>
                    </div>
                  </div>
                )}

                {/* NEW → 面談済 */}
                {deal.status === 'NEW' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-blue-600 mb-3">新規の場合</p>
                    <button onClick={() => handleStatusChange('INTERVIEWED')} className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm transition">
                      面談済みにする
                    </button>
                  </div>
                )}

                {/* CONTRACTED → 詳細入力 */}
                {deal.status === 'CONTRACTED' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-3">成約の場合</p>
                    <Link href={`/deals/${params.id}/contract-detail`} className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm transition text-center">
                      詳細入力へ進む
                    </Link>
                  </div>
                )}

                {/* CONSIDERING → 成約/対象外 + 検討管理 */}
                {deal.status === 'CONSIDERING' && (
                  <>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-600 mb-3">検討中の場合</p>
                      <div className="flex flex-col gap-2">
                        <button onClick={handleContracted} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition">
                          成約
                        </button>
                        <button onClick={handleOutOfScope} className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium text-sm transition">
                          対象外
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 mb-3">検討の場合</p>
                      <Link href="/review" className="block w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm transition text-center">
                        検討管理へ
                      </Link>
                    </div>
                  </>
                )}

                {/* DETAIL_ENTERED → 事務承認 */}
                {deal.status === 'DETAIL_ENTERED' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Link href={`/deals/${params.id}/approval`} className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition text-center">
                      事務承認画面へ
                    </Link>
                  </div>
                )}

                {/* APPROVED → 締結 */}
                {deal.status === 'APPROVED' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Link href={`/deals/${params.id}/contract`} className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition text-center">
                      締結画面へ進む
                    </Link>
                  </div>
                )}

                {/* CONTRACT_SIGNED → 支払管理 */}
                {deal.status === 'CONTRACT_SIGNED' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <button onClick={() => handleStatusChange('PAYMENT_MANAGING')} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition">
                      支払管理へ移行
                    </button>
                  </div>
                )}

                {/* PAYMENT_MANAGING → 完了 */}
                {deal.status === 'PAYMENT_MANAGING' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <button onClick={() => handleStatusChange('COMPLETED')} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition">
                      完了にする
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {deal.status === 'COMPLETED' ? 'この案件は完了しています。' : 'ステータスの変更はできません。'}
              </p>
            )}
          </div>

          {/* 案件情報サイドバー */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-bold mb-3 pb-2 border-b border-gray-100">案件情報</h2>
            <div className="space-y-0 text-sm">
              {[
                ['面談ステータス', deal.interview_status || '-'],
                ['結果ステータス', deal.result_status || '（未選択）'],
                ['契約書締結確認', deal.contract_confirmation || '未送付'],
                ['見込み顧客', deal.prospect_level || '-'],
                ['代理店新旧', deal.agency_type || '-'],
              ].map(([key, value], i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400">{key}</span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 対象外確認ダイアログ */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-lg font-bold mb-3">対象外に変更しますか？</h2>
            <p className="text-gray-600 mb-6 text-sm">
              この操作を行うと、案件は「対象外」として終了します。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setPendingStatus(null); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmOutOfScope}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                対象外にする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
