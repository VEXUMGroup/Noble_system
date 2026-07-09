'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  mockDeals,
  mockNotifications,
  getUserName,
  formatDate,
  getDaysUntil,
} from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Icons
const AlertCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const Bell = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const Info = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function DashboardPage() {
  const router = useRouter();
  // 仕様書 5.8: ダッシュボードアクセス時にポップアップ自動表示
  const [showRetirementPopup, setShowRetirementPopup] = useState(true);

  // Calculate summary stats
  const totalDeals = mockDeals.length;
  const newAndInterviewedDeals = mockDeals.filter((d) =>
    ['NEW', 'INTERVIEWED'].includes(d.status)
  ).length;

  const contractedDeals = mockDeals.filter((d) => {
    const contractedStatuses = [
      'CONTRACTED',
      'DETAIL_ENTERED',
      'APPROVED',
      'CONTRACT_SIGNED',
      'PAYMENT_MANAGING',
      'COMPLETED',
    ];
    return contractedStatuses.includes(d.status);
  }).length;

  const consideringDeals = mockDeals.filter((d) => d.status === 'CONSIDERING').length;

  // Get deals within 14 days of retirement with CONSIDERING status
  const retirementAlerts = mockDeals.filter((deal) => {
    if (deal.status !== 'CONSIDERING') return false;
    return getDaysUntil(deal.retirement_date) <= 14;
  });

  // Get retirements within the next 30 days sorted by retirement_date ascending
  const upcomingRetirees = [...mockDeals]
    .filter((deal) => {
      const daysUntilRetirement = getDaysUntil(deal.retirement_date);
      return Number.isFinite(daysUntilRetirement) && daysUntilRetirement >= 0 && daysUntilRetirement <= 30;
    })
    .sort((a, b) => {
      return parseLocalDate(a.retirement_date).getTime() - parseLocalDate(b.retirement_date).getTime();
    });

  // Get notifications
  const notifications = mockNotifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'warning':
      case 'retirement_alert':
        return <AlertCircle className="w-4 h-4" />;
      case 'success':
      case 'contract_complete':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ダッシュボード</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
          <div className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">新規・面談待ち</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{newAndInterviewedDeals}</div>
          <div className="text-gray-500 text-xs mt-1 sm:mt-2">件</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
          <div className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">成約案件</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{contractedDeals}</div>
          <div className="text-gray-500 text-xs mt-1 sm:mt-2">件</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-orange-500">
          <div className="text-gray-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">検討中</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{consideringDeals}</div>
          <div className="text-gray-500 text-xs mt-1 sm:mt-2">件</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Retirement Alert Section */}
          {retirementAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">退職日アラート</h2>
              {retirementAlerts.map((deal) => {
                const daysRemaining = getDaysUntil(deal.retirement_date);
                return (
                  <div
                    key={deal.id}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 hidden sm:block" />
                    <div className="flex-grow min-w-0">
                      <p className="text-yellow-900 font-medium">{deal.customer_name}</p>
                      <p className="text-yellow-800 text-sm">
                        退職予定日: {formatDate(deal.retirement_date)} ({daysRemaining}日後)
                      </p>
                    </div>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="block text-center sm:inline sm:text-left bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1.5 rounded transition flex-shrink-0"
                    >
                      詳細確認
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Deals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">今後1ヶ月の退職予定</h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">退職日が今後30日以内の案件を表示しています。</p>
              </div>
              <Link
                href="/deals"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                商談一覧を見る
              </Link>
            </div>

            {/* モバイル: カード表示 */}
            <div className="sm:hidden space-y-2">
              {upcomingRetirees.length > 0 ? (
                upcomingRetirees.map((deal) => {
                  const daysUntilRetirement = getDaysUntil(deal.retirement_date);
                  return (
                    <div
                      key={deal.id}
                      onClick={() => router.push(`/deals/${deal.id}`)}
                      className="bg-white rounded-xl shadow-sm p-4 cursor-pointer active:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{deal.customer_name}</p>
                        <StatusBadge status={deal.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-1">
                        <span>担当：{getUserName(deal.assigned_to)}</span>
                        <span>退職日：{formatDate(deal.retirement_date)}</span>
                        <span className="col-span-2">退職まで{daysUntilRetirement}日</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  今後30日以内の退職予定はありません。
                </div>
              )}
            </div>

            {/* デスクトップ: テーブル表示 */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">ID</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">顧客名</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">担当</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">ステータス</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">退職日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingRetirees.length > 0 ? (
                    upcomingRetirees.map((deal) => (
                      <tr
                        key={deal.id}
                        onClick={() => router.push(`/deals/${deal.id}`)}
                        className="hover:bg-gray-50 transition cursor-pointer"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{deal.id}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{deal.customer_name}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{getUserName(deal.assigned_to)}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm"><StatusBadge status={deal.status} /></td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{formatDate(deal.retirement_date)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-6 text-center text-sm text-gray-500">
                        今後30日以内の退職予定はありません。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notifications Sidebar */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">通知</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex gap-3">
                  <div className="text-blue-600 flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.created_at.split('T')[0])}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">直近のタスク</h2>
            <span className="text-sm text-gray-500">{totalDeals}件中</span>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
              <p className="text-sm font-medium text-yellow-900">検討案件の後追い確認</p>
              <p className="text-sm text-yellow-800 mt-1">
                退職予定日が近い案件を優先して確認してください。
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-900">事務承認待ちの確認</p>
              <p className="text-sm text-blue-800 mt-1">
                詳細入力済み案件を承認フローへ進めてください。
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-900">未入金案件の督促準備</p>
              <p className="text-sm text-red-800 mt-1">
                支払期限3日前通知と未入金リマインド対象を確認してください。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 仕様書 5.8: 退職日14日前ポップアップ通知
          - 発動条件: 検討中案件で退職予定日の14日前
          - 表示タイミング: ダッシュボードアクセス時に自動表示
          - アクションボタン: 「商談詳細を確認」/ 「後で確認」
          - 複数案件: 件数バッジ＋リスト形式で全件表示 */}
      {showRetirementPopup && retirementAlerts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Popup Header */}
            <div className="bg-yellow-500 px-6 py-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-white flex-shrink-0" />
              <div className="text-white">
                <h2 className="text-lg font-bold">退職日アラート</h2>
                <p className="text-yellow-100 text-sm">
                  {retirementAlerts.length}件の検討中案件で退職予定日が14日以内です
                </p>
              </div>
            </div>

            {/* Alert List */}
            <div className="px-6 py-4 max-h-80 overflow-y-auto divide-y divide-gray-100">
              {retirementAlerts.map((deal) => {
                const daysRemaining = getDaysUntil(deal.retirement_date);
                return (
                  <div key={deal.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{deal.customer_name}様</p>
                      <p className="text-sm text-gray-600">
                        退職予定日: {formatDate(deal.retirement_date)}
                        <span className="ml-2 text-red-600 font-bold">({daysRemaining}日後)</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">成約確認を行いましょう。</p>
                    </div>
                    <Link
                      href={`/deals/${deal.id}`}
                      onClick={() => setShowRetirementPopup(false)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap transition-colors"
                    >
                      商談詳細を確認
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Popup Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowRetirementPopup(false)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                後で確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
