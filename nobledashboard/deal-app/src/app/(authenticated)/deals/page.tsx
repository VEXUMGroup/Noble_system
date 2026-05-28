'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STATUS_CONFIG } from '@/lib/types';
import { formatDate, getDaysUntil } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useMasterData } from '@/lib/useMasterData';
import { useDeals } from '@/lib/useDeals';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AgencySearchSelect from '@/components/ui/AgencySearchSelect';
import { ICalSettingsBar } from '@/components/ICalSettingsBar';
import { GoogleCalendarPanel } from '@/components/GoogleCalendarPanel';

export default function DealsPage() {
  const router = useRouter();
  const { userId, role, isLoading: userLoading } = useCurrentUser();
  const [dealsRefreshToken, setDealsRefreshToken] = useState(0);
  const { deals: rawDeals, isLoading: dealsLoading } = useDeals(
    role === 'manager' ? undefined : userId ? { assigned_to: userId } : undefined,
    dealsRefreshToken
  );
  const deals = rawDeals as unknown as Array<Record<string, any>>;
  const { users, sources, agencies, isLoading: masterLoading } = useMasterData();
  const displayUsers = users;
  const displaySources = sources;
  const displayAgencies = agencies;

  const getUserName = (userId: string) =>
    displayUsers.find((u) => u.id === userId)?.name ?? userId ?? '-';
  const getSourceName = (code?: string) =>
    displaySources.find((s) => s.code === code)?.name ?? code ?? '-';
  const getAgencyName = (code?: string) =>
    displayAgencies.find((a) => a.code === code)?.name ?? code ?? '-';

  // 商談一覧では「成約以上」を表示しない（成約〜完了の内部ステータスを除外）
  const hiddenStatuses = new Set([
    'CONTRACTED',
    'DETAIL_ENTERED',
    'APPROVED',
    'CONTRACT_SIGNED',
    'PAYMENT_MANAGING',
    'COMPLETED',
  ]);
  const visibleStatusKeys = Object.keys(STATUS_CONFIG).filter((status) => !hiddenStatuses.has(status));

  // Filter states - 担当者フィルターは現在のユーザーでプリセット
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>(role === 'manager' ? '' : userId || '');
  const [dealDateFromFilter, setDealDateFromFilter] = useState<string>('');
  const [dealDateToFilter, setDealDateToFilter] = useState<string>('');
  const [agencyFilter, setAgencyFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  // userId が取得されたら assignedToFilter を更新
  useEffect(() => {
    if (role !== 'manager' && userId) {
      setAssignedToFilter(userId);
    }
  }, [role, userId]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Apply filters
  const filteredDeals = deals.filter((deal) => {
    if (hiddenStatuses.has(deal.status)) return false;
    if (statusFilter && deal.status !== statusFilter) return false;
    if (assignedToFilter && deal.assigned_to !== assignedToFilter) return false;
    if (dealDateFromFilter && new Date(deal.deal_date) < new Date(dealDateFromFilter)) return false;
    if (dealDateToFilter && new Date(deal.deal_date) > new Date(dealDateToFilter)) return false;
    if (agencyFilter && deal.agency_code !== agencyFilter) return false;
    if (sourceFilter && deal.source !== sourceFilter) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const paginatedDeals = filteredDeals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset filters
  const handleReset = () => {
    setStatusFilter('');
    setAssignedToFilter(role === 'sales' && userId ? userId : '');
    setDealDateFromFilter('');
    setDealDateToFilter('');
    setAgencyFilter('');
    setSourceFilter('');
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
  };

  // ユーザー情報またはデータ読み込み中の場合
  const isLoading = userLoading || dealsLoading;

  return (
    <div className="space-y-6">
      {/* ローディング状態 */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium">読み込み中...</p>
        </div>
      )}

      {/* カレンダー連携ステータスバー */}
      <ICalSettingsBar />

      {/* カレンダー予定（商談化導線） */}
      <GoogleCalendarPanel onDealCreated={() => setDealsRefreshToken((v) => v + 1)} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">商談一覧</h1>
        <Link
          href="/deals/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          + 新規商談
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-4">
          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-gray-700">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {visibleStatusKeys.map((status) => (
                <option key={status} value={status}>
                  {STATUS_CONFIG[status].label}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-gray-700">
              担当者 <span className="text-xs text-gray-500">(デフォルト: あなたの案件)</span>
            </label>
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              disabled={role === 'sales'}
              className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {role !== 'sales' && <option value="">すべて</option>}
              {displayUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* Deal Date From Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-gray-700">商談日(From)</label>
            <input
              type="date"
              value={dealDateFromFilter}
              onChange={(e) => setDealDateFromFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Deal Date To Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-gray-700">商談日(To)</label>
            <input
              type="date"
              value={dealDateToFilter}
              onChange={(e) => setDealDateToFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Agency Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-gray-700">代理店</label>
            <AgencySearchSelect
              value={agencyFilter}
              onChange={(code) => setAgencyFilter(code)}
              agencies={displayAgencies}
              placeholder="すべて"
            />
          </div>

          {/* Source Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs sm:text-sm font-medium text-gray-700">流入経路</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {displaySources.map((source) => (
                <option key={source.code} value={source.code}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="col-span-2 flex gap-2 sm:ml-auto sm:col-span-auto">
            <button
              onClick={handleSearch}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm"
            >
              検索
            </button>
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-none border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg transition text-sm"
            >
              リセット
            </button>
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="text-sm font-medium text-gray-700">全 {filteredDeals.length} 件</div>

      {/* モバイル: カード表示 */}
      <div className="sm:hidden space-y-2">
        {paginatedDeals.map((deal) => {
          const isAlertRow = deal.status === 'CONSIDERING' && getDaysUntil(deal.retirement_date) <= 14;
          return (
            <div
              key={deal.id}
              onClick={() => router.push(`/deals/${deal.id}`)}
              className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer active:bg-gray-50 ${isAlertRow ? 'border-l-4 border-red-400' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-gray-900 text-sm">{deal.customer_name}</p>
                <StatusBadge status={deal.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>担当：{getUserName(deal.assigned_to)}</span>
                <span>商談日：{formatDate(deal.deal_date)}</span>
                <span>退職予定：{formatDate(deal.retirement_date)}</span>
                <span>流入：{getSourceName(deal.source)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* デスクトップ: テーブル表示 */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">ID</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">顧客名</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">担当</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">商談日</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">退職予定日</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">ステータス</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">流入</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">代理店</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedDeals.map((deal) => {
              const isAlertRow =
                deal.status === 'CONSIDERING' && getDaysUntil(deal.retirement_date) <= 14;
              return (
                <tr
                  key={deal.id}
                  onClick={() => router.push(`/deals/${deal.id}`)}
                  className={`cursor-pointer hover:bg-gray-50 transition ${
                    isAlertRow ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{deal.id}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{deal.customer_name}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{getUserName(deal.assigned_to)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{formatDate(deal.deal_date)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{formatDate(deal.retirement_date)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <StatusBadge status={deal.status} />
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{getSourceName(deal.source)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{getAgencyName(deal.agency_code)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition"
        >
          前へ
        </button>
        <span className="text-sm font-medium text-gray-700">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
