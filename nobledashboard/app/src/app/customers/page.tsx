'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CONTRACT_STATUS_CONFIG, SUPPORT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/types';
import {
  mockCustomers,
  mockUsers,
  getUserName,
  formatCurrency,
  formatDate,
  type Customer,
} from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function CustomersPage() {
  const router = useRouter();

  // Filter states
  const [contractStatusFilter, setContractStatusFilter] = useState<string>('');
  const [supportStatusFilter, setSupportStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Apply filters
  const filteredCustomers = mockCustomers.filter((customer) => {
    if (contractStatusFilter && customer.contract_status !== contractStatusFilter) return false;
    if (supportStatusFilter && customer.support_status !== supportStatusFilter) return false;
    if (paymentStatusFilter && customer.payment_status !== paymentStatusFilter) return false;
    if (assignedToFilter && customer.assigned_to !== assignedToFilter) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate summary metrics
  const totalCustomers = mockCustomers.length;
  const activeCount = mockCustomers.filter((c) => c.contract_status === 'ACTIVE').length;
  const paidCount = mockCustomers.filter((c) => c.payment_status === 'PAID').length;
  const unpaidCount = mockCustomers.filter((c) => c.payment_status === 'UNPAID').length;

  // Reset filters
  const handleReset = () => {
    setContractStatusFilter('');
    setSupportStatusFilter('');
    setPaymentStatusFilter('');
    setAssignedToFilter('');
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">顧客管理</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-600">総顧客数</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalCustomers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-600">成約中</p>
          <p className="text-2xl font-bold text-teal-700 mt-2">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-600">全額入金完了</p>
          <p className="text-2xl font-bold text-green-700 mt-2">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-600">未入金</p>
          <p className="text-2xl font-bold text-red-700 mt-2">{unpaidCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex flex-wrap gap-3 sm:gap-4">
        {/* Contract Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">契約ステータス</label>
          <select
            value={contractStatusFilter}
            onChange={(e) => setContractStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {Object.keys(CONTRACT_STATUS_CONFIG).map((status) => (
              <option key={status} value={status}>
                {CONTRACT_STATUS_CONFIG[status as keyof typeof CONTRACT_STATUS_CONFIG].label}
              </option>
            ))}
          </select>
        </div>

        {/* Support Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">サポートステータス</label>
          <select
            value={supportStatusFilter}
            onChange={(e) => setSupportStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {Object.keys(SUPPORT_STATUS_CONFIG).map((status) => (
              <option key={status} value={status}>
                {SUPPORT_STATUS_CONFIG[status as keyof typeof SUPPORT_STATUS_CONFIG].label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">支払いステータス</label>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {Object.keys(PAYMENT_STATUS_CONFIG).map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG].label}
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
      <div className="text-sm font-medium text-gray-700">全 {filteredCustomers.length} 件</div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">顧客番号</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">顧客名</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">フリガナ</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">担当者</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">成約月</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">成約プラン</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">成約金額</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">契約ステータス</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">サポート</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">支払い</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedCustomers.map((customer) => (
              <tr
                key={customer.customer_id}
                onClick={() => router.push(`/customers/${customer.customer_id}`)}
                className="cursor-pointer hover:bg-gray-50 transition"
              >
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{customer.customer_id}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{customer.customer_name}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{customer.furigana}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{getUserName(customer.assigned_to)}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{customer.contract_month}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{customer.contract_plan}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">
                  {formatCurrency(customer.contract_amount)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      CONTRACT_STATUS_CONFIG[customer.contract_status].bgColor
                    } ${CONTRACT_STATUS_CONFIG[customer.contract_status].textColor}`}
                  >
                    {CONTRACT_STATUS_CONFIG[customer.contract_status].label}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      SUPPORT_STATUS_CONFIG[customer.support_status].bgColor
                    } ${SUPPORT_STATUS_CONFIG[customer.support_status].textColor}`}
                  >
                    {SUPPORT_STATUS_CONFIG[customer.support_status].label}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      PAYMENT_STATUS_CONFIG[customer.payment_status].bgColor
                    } ${PAYMENT_STATUS_CONFIG[customer.payment_status].textColor}`}
                  >
                    {PAYMENT_STATUS_CONFIG[customer.payment_status].label}
                  </span>
                </td>
              </tr>
            ))}
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
