'use client';

import { useMemo, useState } from 'react';
import {
  PAYMENT_STATUS_CONFIG,
  CONTRACT_STATUS_CONFIG,
  SUPPORT_STATUS_CONFIG,
  type PaymentStatus,
} from '@/lib/types';
import {
  mockPayments,
  mockCustomers,
  getCustomerById,
  formatCurrency,
  formatDate,
  type Payment,
  type Customer,
} from '@/lib/mock-data';

export default function PaymentsPage() {
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [installmentNoticeFilter, setInstallmentNoticeFilter] = useState('all');

  // Apply filters
  const filteredPayments = useMemo(() => {
    return mockPayments.filter((payment) => {
      if (paymentStatusFilter !== 'all' && payment.payment_status !== paymentStatusFilter) {
        return false;
      }
      if (paymentMethodFilter !== 'all' && payment.payment_method !== paymentMethodFilter) {
        return false;
      }
      if (installmentNoticeFilter !== 'all' && payment.installment_notice_status !== installmentNoticeFilter) {
        return false;
      }
      return true;
    });
  }, [paymentStatusFilter, paymentMethodFilter, installmentNoticeFilter]);

  // Calculate summary cards
  const summary = useMemo(() => {
    const totalCount = mockPayments.length;
    const unpaidCount = mockPayments.filter((p) => p.payment_status === 'UNPAID').length;
    const partialCount = mockPayments.filter((p) => p.payment_status === 'PARTIAL').length;
    const paidCount = mockPayments.filter((p) => p.payment_status === 'PAID').length;
    const unpaidTotalAmount = mockPayments.reduce((sum, p) => sum + (p.unpaid_amount || 0), 0);

    return {
      totalCount,
      unpaidCount,
      partialCount,
      paidCount,
      unpaidTotalAmount,
    };
  }, []);

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const config = PAYMENT_STATUS_CONFIG[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">入金管理</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">総件数</p>
          <p className="text-3xl font-bold text-gray-900">{summary.totalCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">未入金件数</p>
          <p className="text-3xl font-bold text-red-600">{summary.unpaidCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">一部入金件数</p>
          <p className="text-3xl font-bold text-yellow-600">{summary.partialCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">入金完了件数</p>
          <p className="text-3xl font-bold text-green-600">{summary.paidCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">未回収合計金額</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.unpaidTotalAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">支払いステータス</label>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value as PaymentStatus | 'all')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="UNPAID">未入金</option>
            <option value="PARTIAL">一部入金</option>
            <option value="PAID">全額入金完了</option>
            <option value="OVERPAID">過剰入金</option>
            <option value="CANCELLED">キャンセル</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">支払い方法</label>
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="振込">振込</option>
            <option value="カード">カード</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">分割案内進捗</label>
          <select
            value={installmentNoticeFilter}
            onChange={(e) => setInstallmentNoticeFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="案内終了">案内終了</option>
            <option value="対応中">対応中</option>
            <option value="未案内">未案内</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">顧客番号</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">顧客名</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">支払いステータス</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">支払い方法</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">支払い予定回数</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">支払い済回数</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">支払い済金額</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">未払い金額</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">入金期日</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">分割案内進捗</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => {
              const customer = getCustomerById(payment.customer_id);
              return (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{payment.customer_id}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{customer?.customer_name || '-'}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    {getPaymentStatusBadge(payment.payment_status)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{payment.payment_method}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{payment.payment_count || '-'}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{payment.paid_count || 0}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{formatCurrency(payment.paid_amount)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{formatCurrency(payment.unpaid_amount)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{formatDate(payment.payment_due_date)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{payment.installment_notice_status || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
