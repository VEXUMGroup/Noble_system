'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/format';
import { useMasterData } from '@/lib/useMasterData';
import { useDeals } from '@/lib/useDeals';
import { useCurrentUser } from '@/lib/useCurrentUser';

type CustomerSummary = {
  customerName: string;
  dealCount: number;
  latestStatus: string;
  latestDealDate: string;
  assignedTo: string;
  latestDealId: string | number;
  age?: string;
  email?: string;
  phone?: string;
};

export default function CustomersPage() {
  const router = useRouter();
  const { userId, role, isLoading: userLoading } = useCurrentUser();
  const { deals: rawDeals, isLoading: dealsLoading } = useDeals(
    role === 'manager' ? undefined : userId ? { assigned_to: userId } : undefined
  );
  const deals = rawDeals as unknown as Array<Record<string, any>>;
  const { users } = useMasterData();

  const [searchQuery, setSearchQuery] = useState('');
  const [deletingName, setDeletingName] = useState<string | null>(null);

  // ユーザー情報またはディール取得中のローディング状態
  const isLoading = userLoading || dealsLoading;

  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name ?? userId ?? '-';

  // Group deals by customer_name
  const customers: CustomerSummary[] = useMemo(() => {
    const map = new Map<string, CustomerSummary>();
    const contractOrLater = new Set([
      'CONTRACTED',
      'RS_CONTRACT',
      'DETAIL_ENTERED',
      'APPROVED',
      'CONTRACT_SIGNED',
      'PAYMENT_MANAGING',
      'COMPLETED',
    ]);

    for (const deal of deals) {
      if (!contractOrLater.has(String(deal.status ?? ''))) continue;
      const name: string = deal.customer_name ?? '（名前なし）';
      const existing = map.get(name);
      const custom = (deal.custom_data ?? {}) as Record<string, unknown>;
      const ageValue = deal.age ?? custom.age;
      const age = ageValue != null && ageValue !== '' ? String(ageValue) : '';
      const email = custom.email != null && custom.email !== '' ? String(custom.email) : '';
      const phone = custom.phone != null && custom.phone !== '' ? String(custom.phone) : '';

      if (!existing) {
        map.set(name, {
          customerName: name,
          dealCount: 1,
          latestStatus: deal.status,
          latestDealDate: deal.deal_date,
          assignedTo: deal.assigned_to,
          latestDealId: deal.id,
          age,
          email,
          phone,
        });
      } else {
        existing.dealCount += 1;
        // 最新の商談日で上書き
        if (deal.deal_date > existing.latestDealDate) {
          existing.latestStatus = deal.status;
          existing.latestDealDate = deal.deal_date;
          existing.assignedTo = deal.assigned_to;
          existing.latestDealId = deal.id;
          existing.age = age;
          existing.email = email;
          existing.phone = phone;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      b.latestDealDate.localeCompare(a.latestDealDate)
    );
  }, [deals]);

  const filteredCustomers = customers.filter((c) =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteCustomerDeals = async (customerName: string) => {
    const ok = window.confirm(`「${customerName}」の商談データを顧客管理から削除します。元に戻せません。`);
    if (!ok) return;
    setDeletingName(customerName);
    const res = await fetch(`/api/customers/${encodeURIComponent(customerName)}`, { method: 'DELETE' });
    const json = await res.json().catch(() => ({}));
    setDeletingName(null);
    if (!res.ok) {
      window.alert(`削除に失敗しました: ${json?.error ?? res.statusText}`);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">顧客管理</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="顧客名で検索..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Count */}
      <div className="text-sm font-medium text-gray-700">全 {filteredCustomers.length} 件</div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-sm text-gray-400">
          読み込み中...
        </div>
      )}

      {/* Mobile: card view */}
      {!isLoading && (
        <div className="sm:hidden space-y-2">
          {filteredCustomers.map((c) => (
            <div
              key={c.customerName}
              onClick={() => router.push(`/deals/${c.latestDealId}`)}
              className="bg-white rounded-xl shadow-sm p-4 cursor-pointer active:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-gray-900 text-sm">{c.customerName}</p>
                <StatusBadge status={c.latestStatus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>商談数：{c.dealCount} 件</span>
                <span>最終商談日：{formatDate(c.latestDealDate)}</span>
                <span>担当：{getUserName(c.assignedTo)}</span>
                <span>年齢：{c.age || '-'}</span>
                <span className="col-span-2">メール：{c.email || '-'}</span>
                <span className="col-span-2">電話：{c.phone || '-'}</span>
              </div>
              <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => router.push(`/deals/${c.latestDealId}`)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteCustomerDeals(c.customerName)}
                  disabled={deletingName === c.customerName}
                  className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingName === c.customerName ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-sm text-gray-400">
              顧客が見つかりません
            </div>
          )}
        </div>
      )}

      {/* Desktop: table view */}
      {!isLoading && (
        <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">顧客名</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">商談数</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">最新ステータス</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">最終商談日</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">担当者</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">年齢</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">メール</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">電話</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((c) => (
                <tr
                  key={c.customerName}
                  onClick={() => router.push(`/deals/${c.latestDealId}`)}
                  className="cursor-pointer hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{c.dealCount} 件</td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={c.latestStatus} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatDate(c.latestDealDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{getUserName(c.assignedTo)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{c.age || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-[260px] truncate">{c.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{c.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/deals/${c.latestDealId}`)}
                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCustomerDeals(c.customerName)}
                        disabled={deletingName === c.customerName}
                        className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingName === c.customerName ? '削除中...' : '削除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-400">
                    顧客が見つかりません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
