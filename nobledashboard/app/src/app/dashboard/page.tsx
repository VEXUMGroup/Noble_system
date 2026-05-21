'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { INTERVIEW_STATUS_CONFIG, RESULT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/types';
import {
  mockDeals,
  mockCustomers,
  mockPayments,
  mockNotifications,
  getUserName,
  formatCurrency,
  formatDate,
  getDaysUntil,
} from '@/lib/mock-data';

// Icons
const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const Bell = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const Info = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function DashboardPage() {
  const router = useRouter();

  // ========== 商談サマリー ==========
  const totalDeals = mockDeals.length;
  const contractedDeals = mockDeals.filter((d) => d.result_status === 'CONTRACTED').length;
  const consideringDeals = mockDeals.filter((d) => d.result_status === 'CONSIDERING').length;

  // 今月の成約額
  const thisMonthAmount = mockDeals
    .filter((d) => d.deal_month === '2026/04' && d.result_status === 'CONTRACTED')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  // ========== 顧客サマリー ==========
  const totalCustomers = mockCustomers.length;
  const unpaidCustomers = mockCustomers.filter((c) => c.payment_status === 'UNPAID').length;

  // ========== 入金サマリー ==========
  const totalUnpaid = mockPayments.reduce((sum, p) => sum + (p.unpaid_amount || 0), 0);

  // ========== 退職日アラート ==========
  const retirementAlerts = mockDeals.filter((deal) => {
    if (deal.result_status !== 'CONSIDERING') return false;
    return getDaysUntil(deal.retirement_date) <= 14;
  });

  // ========== 最近の商談 ==========
  const recentDeals = [...mockDeals]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const notifications = mockNotifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'retirement_alert': return <AlertCircle className="w-4 h-4" />;
      case 'contract_complete': return <CheckCircle className="w-4 h-4" />;
      case 'payment_due': return <Bell className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ダッシュボード</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
          <div className="text-gray-600 text-sm font-medium mb-1">全商談数</div>
          <div className="text-3xl font-bold text-gray-900">{totalDeals}<span className="text-sm text-gray-500 ml-1">件</span></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
          <div className="text-gray-600 text-sm font-medium mb-1">成約</div>
          <div className="text-3xl font-bold text-gray-900">{contractedDeals}<span className="text-sm text-gray-500 ml-1">件</span></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">
          <div className="text-gray-600 text-sm font-medium mb-1">検討中</div>
          <div className="text-3xl font-bold text-gray-900">{consideringDeals}<span className="text-sm text-gray-500 ml-1">件</span></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
          <div className="text-gray-600 text-sm font-medium mb-1">今月の成約額</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthAmount)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500">
          <div className="text-gray-600 text-sm font-medium mb-1">未回収額</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalUnpaid)}</div>
        </div>
      </div>

      {/* 顧客・入金ミニカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/customers" className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition block">
          <div className="text-gray-600 text-sm font-medium mb-1">総顧客数</div>
          <div className="text-2xl font-bold text-gray-900">{totalCustomers}<span className="text-sm text-gray-500 ml-1">名</span></div>
        </Link>
        <Link href="/customers" className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition block">
          <div className="text-gray-600 text-sm font-medium mb-1">未入金の顧客</div>
          <div className="text-2xl font-bold text-red-600">{unpaidCustomers}<span className="text-sm text-gray-500 ml-1">名</span></div>
        </Link>
        <Link href="/payments" className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition block">
          <div className="text-gray-600 text-sm font-medium mb-1">入金管理件数</div>
          <div className="text-2xl font-bold text-gray-900">{mockPayments.length}<span className="text-sm text-gray-500 ml-1">件</span></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Retirement Alert Section */}
          {retirementAlerts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">退職日アラート</h2>
              {retirementAlerts.map((deal) => {
                const daysRemaining = getDaysUntil(deal.retirement_date);
                return (
                  <div key={deal.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-yellow-900 font-medium">{deal.customer_name}</p>
                      <p className="text-yellow-800 text-sm">
                        退職予定日: {formatDate(deal.retirement_date)} ({daysRemaining}日後)
                      </p>
                    </div>
                    <Link href={`/deals/${deal.id}`} className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1 rounded transition flex-shrink-0">
                      詳細確認
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Deals Table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">最近の商談</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">顧客名</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">担当</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">面談</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">結果</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">商談月</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentDeals.map((deal) => {
                    const iConfig = INTERVIEW_STATUS_CONFIG[deal.interview_status];
                    const rConfig = deal.result_status ? RESULT_STATUS_CONFIG[deal.result_status] : null;
                    return (
                      <tr key={deal.id} onClick={() => router.push(`/deals/${deal.id}`)} className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">{deal.customer_name}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">{getUserName(deal.assigned_to)}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${iConfig.bgColor} ${iConfig.textColor}`}>
                            {iConfig.label}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                          {rConfig ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${rConfig.bgColor} ${rConfig.textColor}`}>
                              {rConfig.label}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">{deal.deal_month}</td>
                      </tr>
                    );
                  })}
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
              <div key={notification.id} className={`p-4 ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                <div className="flex gap-3">
                  <div className="text-blue-600 flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at.split('T')[0])}</p>
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
    </div>
  );
}
