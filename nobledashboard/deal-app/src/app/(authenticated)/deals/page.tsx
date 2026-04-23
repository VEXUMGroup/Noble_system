'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STATUS_CONFIG } from '@/lib/types';
import {
  mockDeals,
  mockUsers,
  mockSources,
  mockAgencies,
  getUserName,
  getSourceName,
  getAgencyName,
  formatDate,
  getDaysUntil,
  type Deal,
} from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function DealsPage() {
  const router = useRouter();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [dealDateFromFilter, setDealDateFromFilter] = useState<string>('');
  const [dealDateToFilter, setDealDateToFilter] = useState<string>('');
  const [agencyFilter, setAgencyFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Apply filters
  const filteredDeals = mockDeals.filter((deal) => {
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
    setAssignedToFilter('');
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

  return (
    <div className="space-y-6">
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
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex flex-wrap gap-3 sm:gap-4">
        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">ステータス</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {Object.keys(STATUS_CONFIG).map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned To Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">担当者</label>
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {mockUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Deal Date From Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">商談日(From)</label>
          <input
            type="date"
            value={dealDateFromFilter}
            onChange={(e) => setDealDateFromFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Deal Date To Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">商談日(To)</label>
          <input
            type="date"
            value={dealDateToFilter}
            onChange={(e) => setDealDateToFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Agency Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">代理店</label>
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {mockAgencies.map((agency) => (
              <option key={agency.code} value={agency.code}>
                {agency.name}
              </option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">流入経路</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {mockSources.map((source) => (
              <option key={source.code} value={source.code}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            検索
          </button>
          <button
            onClick={handleReset}
            className="border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg transition"
          >
            リセット
          </button>
        </div>
      </div>

      {/* Count */}
      <div className="text-sm font-medium text-gray-700">全 {filteredDeals.length} 件</div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
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
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                    {formatDate(deal.retirement_date)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <StatusBadge status={deal.status} />
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{getSourceName(deal.source)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                    {getAgencyName(deal.agency_code)}
                  </td>
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
