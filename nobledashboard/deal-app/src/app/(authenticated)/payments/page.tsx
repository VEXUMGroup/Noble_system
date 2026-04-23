'use client';

import { useMemo, useState } from 'react';
import {
  STATUS_CONFIG,
  type DealStatus,
} from '@/lib/types';
import {
  mockDeals,
  mockPaymentRecords,
  getAgencyName,
  getPlanName,
  formatCurrency,
  formatDate,
  type Deal,
  type PaymentRecord,
} from '@/lib/mock-data';

interface PaymentDealInfo {
  deal: Deal;
  paid: number;
  unpaid: number;
  status: string;
  statusColor: string;
  history: PaymentRecord[];
  planCount: number;
  paidCount: number;
}

export default function PaymentsPage() {
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState<PaymentDealInfo | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('振り込み確認');
  const [paymentStatus, setPaymentStatus] = useState('入金完了（今回分）');
  const [payerName, setPayerName] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');

  // Use state for mock data so UI recomputes when we update records
  const [deals, setDeals] = useState(() => mockDeals);
  const [paymentRecords, setPaymentRecords] = useState(() => mockPaymentRecords);
  // Build payment deal info
  const paymentDeals = useMemo(() => {
    return deals
      .filter(
        (deal) =>
          deal.status === 'PAYMENT_MANAGING' ||
          deal.status === 'COMPLETED' ||
          deal.status === 'CONTRACT_SIGNED'
      )
      .map((deal): PaymentDealInfo => {
        const history = paymentRecords.filter((r) => r.deal_id === deal.id);
        const paid = deal.total_paid || 0;
        const amount = deal.amount || 0;
        const unpaid = Math.max(0, amount - paid);
        const planCount = deal.payment_plan === '3回払い' ? 3 : deal.payment_plan === '4回払い' ? 4 : 1;
        const paidCount = history.length;

        let status = '未入金';
        let statusColor = 'bg-red-100 text-red-700';
        if (paid >= amount && amount > 0) {
          status = '全額入金完了';
          statusColor = 'bg-green-100 text-green-700';
        } else if (paid > 0) {
          status = '一部入金';
          statusColor = 'bg-yellow-100 text-yellow-700';
        }

        return { deal, paid, unpaid, status, statusColor, history, planCount, paidCount };
      });
  }, [deals, paymentRecords]);

  // Apply filter
  const filteredDeals = useMemo(() => {
    if (paymentStatusFilter === 'all') return paymentDeals;
    if (paymentStatusFilter === 'unpaid') return paymentDeals.filter((d) => d.paid === 0);
    if (paymentStatusFilter === 'partial') return paymentDeals.filter((d) => d.paid > 0 && d.unpaid > 0);
    if (paymentStatusFilter === 'paid') return paymentDeals.filter((d) => d.status === '全額入金完了');
    return paymentDeals;
  }, [paymentDeals, paymentStatusFilter]);

  // Summary counts
  const summary = useMemo(() => {
    const unpaid = paymentDeals.filter((d) => d.paid === 0).length;
    const partial = paymentDeals.filter((d) => d.paid > 0 && d.unpaid > 0).length;
    const paid = paymentDeals.filter((d) => d.status === '全額入金完了').length;
    return { unpaid, partial, paid, total: paymentDeals.length };
  }, [paymentDeals]);

  // Commission calculation
  const commissions = useMemo(() => {
    const commissionMap = new Map<string, { agency: string; customer: string; amount: number; paid: number; pct: string; trigger: number; commission: number; triggered: boolean }>();

    paymentDeals.forEach((pd) => {
      if (!pd.deal.agency_code) return;
      const amount = pd.deal.amount || 0;
      const trigger = amount * 0.5;
      const commission = amount * 0.25;
      const triggered = pd.paid >= trigger && trigger > 0;
      const key = `${pd.deal.agency_code}-${pd.deal.id}`;
      commissionMap.set(key, {
        agency: getAgencyName(pd.deal.agency_code),
        customer: pd.deal.customer_name,
        amount,
        paid: pd.paid,
        pct: amount > 0 ? Math.round((pd.paid / amount) * 100) + '%' : '0%',
        trigger,
        commission,
        triggered,
      });
    });

    return Array.from(commissionMap.values()).filter((c) => c.amount > 0);
  }, [paymentDeals]);

  const handleOpenPaymentModal = (paymentDeal: PaymentDealInfo) => {
    setSelectedDeal(paymentDeal);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentAmount(
      paymentDeal.deal.amount && paymentDeal.planCount
        ? String(Math.round(paymentDeal.deal.amount / paymentDeal.planCount))
        : ''
    );
    setPaymentMethod(
      paymentDeal.deal.payment_method === 'stripe' ? 'Stripe自動決済' : '振り込み確認'
    );
    setPaymentStatus('入金完了（今回分）');
    setPayerName('');
    setPaymentMemo(`${paymentDeal.paidCount + 1}回目/${paymentDeal.planCount}回 入金確認済み`);
    setPaymentMessage('');
  };

  const handleRegisterPayment = () => {
    if (!selectedDeal) return;

    const amount = Number(paymentAmount.replace(/,/g, ''));
    if (!paymentDate || Number.isNaN(amount) || amount <= 0) {
      setPaymentMessage('入金日と正しい入金額を入力してください。');
      return;
    }

    const newRecord = {
      id: `PAY${String(paymentRecords.length + 1).padStart(3, '0')}`,
      deal_id: selectedDeal.deal.id,
      date: paymentDate,
      amount,
      method: paymentMethod,
      memo: paymentMemo.trim() || undefined,
      payer_name: payerName.trim() || undefined,
    } as PaymentRecord;

    setPaymentRecords((prev) => [...prev, newRecord]);

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== selectedDeal.deal.id) return d;
        const updatedPaid = (d.total_paid || 0) + amount;
        const totalAmount = d.amount || 0;
        return {
          ...d,
          total_paid: updatedPaid,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
          status: totalAmount > 0 && updatedPaid >= totalAmount ? 'COMPLETED' : 'PAYMENT_MANAGING',
        };
      })
    );

    setPaymentMessage('入金を登録しました。');
    setTimeout(() => {
      setSelectedDeal(null);
      setPaymentMessage('');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-blue-600 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">支払管理</h1>
          <p className="text-xs text-gray-500 mt-1">支払処理の実行・状況管理・代理店コミッション｜対象: 管理</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: '未入金', count: summary.unpaid, color: 'border-red-500', textColor: 'text-red-600' },
          { label: '一部入金', count: summary.partial, color: 'border-yellow-500', textColor: 'text-yellow-600' },
          { label: '全額入金完了', count: summary.paid, color: 'border-green-500', textColor: 'text-green-600' },
          { label: '合計', count: summary.total, color: 'border-blue-500', textColor: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${s.color} text-center`}>
            <p className={`text-3xl font-bold ${s.textColor}`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">支払い一覧</h2>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="unpaid">未入金</option>
            <option value="partial">一部入金</option>
            <option value="paid">全額入金完了</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                {['顧客氏名', '成約金額', '支払方法', '支払プラン', '入金済', '未払い', '支払ステータス', '入金期日', '代理店', '操作'].map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((pd, i) => (
                <tr
                  key={pd.deal.id}
                  className={`${pd.status === '未入金' ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition`}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{pd.deal.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(pd.deal.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{pd.deal.payment_method === 'stripe' ? 'Stripe' : pd.deal.payment_method === 'transfer' ? '振り込み' : pd.deal.payment_method || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{pd.deal.payment_plan || '一括'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(pd.paid)}</td>
                  <td className={`px-4 py-3 text-sm font-semibold text-right ${pd.unpaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(pd.unpaid)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${pd.statusColor}`}>
                      {pd.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(pd.deal.payment_deadline)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{getAgencyName(pd.deal.agency_code)}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenPaymentModal(pd)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        pd.status === '全額入金完了'
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {pd.status === '全額入金完了' ? '履歴' : '入金入力'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 入金入力モーダル */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-600">
              <h3 className="text-lg font-bold text-gray-900">
                入金管理 - {selectedDeal.deal.customer_name} 様
              </h3>
              <button
                onClick={() => setSelectedDeal(null)}
                className="text-gray-400 hover:text-gray-600 text-xl px-1"
              >
                ✕
              </button>
            </div>

            {/* 顧客支払サマリー */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">成約金額</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedDeal.deal.amount)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">入金済</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(selectedDeal.paid)}</p>
              </div>
              <div className={`${selectedDeal.unpaid > 0 ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-3 text-center`}>
                <p className="text-xs text-gray-500">未払い残高</p>
                <p className={`text-lg font-bold ${selectedDeal.unpaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(selectedDeal.unpaid)}
                </p>
              </div>
            </div>

            {/* 支払い詳細情報 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0 mb-5 text-sm">
              {[
                ['支払方法', selectedDeal.deal.payment_method === 'stripe' ? 'Stripe' : '振り込み'],
                ['支払プラン', selectedDeal.deal.payment_plan || '一括'],
                ['支払済回数', `${selectedDeal.paidCount}/${selectedDeal.planCount}回`],
                ['次回入金期日', formatDate(selectedDeal.deal.payment_deadline)],
                ['代理店', getAgencyName(selectedDeal.deal.agency_code)],
                ['支払ステータス', selectedDeal.status],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>

            {/* 入金履歴 */}
            {selectedDeal.history.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-bold text-gray-900 mb-2">入金履歴</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        {['入金日', '入金額', '入金方法', 'メモ'].map((col) => (
                          <th key={col} className="px-3 py-2 text-left text-xs font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDeal.history.map((h, i) => (
                        <tr key={h.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 text-sm text-gray-700">{formatDate(h.date)}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right font-semibold">{formatCurrency(h.amount)}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{h.method}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{h.memo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 入金入力フォーム（未完了の場合のみ表示） */}
            {selectedDeal.status !== '全額入金完了' ? (
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                <h4 className="text-sm font-bold text-blue-700 mb-4">新規入金を登録</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">入金日 <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">入金額（円） <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={`例: ${selectedDeal.deal.amount && selectedDeal.planCount ? Math.round((selectedDeal.deal.amount) / selectedDeal.planCount).toLocaleString() : ''}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">入金方法 <span className="text-red-500">*</span></label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {selectedDeal.deal.payment_method === 'stripe' ? (
                        <>
                          <option>Stripe自動決済</option>
                          <option>Stripe手動決済</option>
                          <option>振り込み（例外対応）</option>
                        </>
                      ) : (
                        <>
                          <option>振り込み確認</option>
                          <option>Stripe（例外対応）</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">支払ステータス更新 <span className="text-red-500">*</span></label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>入金完了（今回分）</option>
                      <option>全額入金完了</option>
                      <option>一部入金</option>
                      <option>過剰入金</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">支払い名義</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="顧客名と異なる場合に入力（全角カナ推奨）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">メモ</label>
                  <textarea
                    value={paymentMemo}
                    onChange={(e) => setPaymentMemo(e.target.value)}
                    placeholder={`例: ${selectedDeal.paidCount + 1}回目/${selectedDeal.planCount}回 振り込み確認済み`}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {paymentMessage && (
                  <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                    paymentMessage.includes('登録しました')
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {paymentMessage}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRegisterPayment}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition"
                  >
                    入金を登録
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDeal(null)}
                    className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-medium text-sm transition"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-green-600">全額入金完了済み</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 代理店コミッション管理 */}
      {commissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">代理店コミッション管理</h2>
          <p className="text-xs text-gray-400 mb-4">コミッション自動計算: 利用者の支払総額の50%到達時に、その25%を代理店への支払額として自動計算</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {['代理店', '対象顧客', '成約金額', '入金済', '進捗率', 'トリガー(50%)', 'コミッション(25%)', 'ステータス'].map((col) => (
                    <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.agency}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.customer}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(c.paid)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.pct}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(c.trigger)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(c.commission)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.triggered ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.triggered ? '発生済' : '未発生'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 通知設定 */}
      <div className="bg-yellow-50 rounded-xl shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-3">通知設定</h2>
        <div className="text-sm text-gray-700 space-y-1">
          <p>会計日3日前: 支払期日の3日前にダッシュボード通知 + LINE連携でリマインド</p>
          <p>未入金リマインド: 未入金の利用者へダッシュボード通知 → LINEでリマインド連携</p>
          <p>代理店コミッション発生通知: 支払総額50%到達時に管理者へポップアップ通知</p>
          <p>分割払い対応: 3回払い・4回払い等の分割払いスケジュール管理</p>
        </div>
      </div>
    </div>
  );
}
