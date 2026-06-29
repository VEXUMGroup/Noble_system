'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  STATUS_CONFIG,
  VALID_TRANSITIONS,
  type DealStatus,
} from '@/lib/types';
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/format';
import { useDeals } from '@/lib/useDeals';
import { useMasterData } from '@/lib/useMasterData';

type DealRow = Record<string, any>;

export default function ReviewPage() {
  const router = useRouter();
  const [dismissedAlert, setDismissedAlert] = useState<string | null>(null);

  const { deals: rawDeals, isLoading: dealsLoading } = useDeals();
  const { users, plans, sources, agencies, isLoading: masterLoading } = useMasterData();
  const deals = rawDeals as unknown as DealRow[];
  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.name ?? userId ?? '-';
  const getPlanName = (code?: string) => plans.find((p) => p.code === code)?.name ?? code ?? '-';
  const getAgencyName = (code?: string) => agencies.find((a) => a.code === code)?.name ?? code ?? '-';
  const getSourceName = (code?: string) => sources.find((s) => s.code === code)?.name ?? code ?? '-';
  const consideringStatusCodes = new Set(['CONSIDERING', 'RS_PEND', 'RS_IN_PROG', 'RS_REDEAL']);

  // Filter deals with consideration / active follow-up status
  const consideringDeals = useMemo<DealRow[]>(() => {
    return deals.filter((deal) => consideringStatusCodes.has(String(deal.status ?? '')));
  }, [deals]);

  // Calculate days remaining and sort
  const dealsWithDays = useMemo<Array<DealRow & { daysRemaining: number }>>(() => {
    return consideringDeals
      .map((deal) => ({
        ...deal,
        daysRemaining: getDaysUntil(deal.retirement_date),
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [consideringDeals]);

  // Find alert deal (14 days or less)
  const alertDeal = useMemo(() => {
    return dealsWithDays.find(
      (deal) => deal.daysRemaining <= 14 && deal.daysRemaining > 0
    );
  }, [dealsWithDays]);

  const getRowStyle = (daysRemaining: number): { bg: string; text: string } => {
    if (daysRemaining <= 14) {
      return { bg: 'bg-red-50', text: 'text-red-700' };
    } else if (daysRemaining <= 30) {
      return { bg: 'bg-yellow-50', text: 'text-yellow-700' };
    } else {
      return { bg: 'bg-green-50', text: 'text-green-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">検討管理</h1>
      </div>

      {/* Alert Banner */}
      {alertDeal && !dismissedAlert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium mb-4">
            {alertDeal.customer_name}様の退職予定日が14日以内です。成約確認を行いましょう。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/deals/${alertDeal.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              商談詳細を確認
            </Link>
            <button
              onClick={() => setDismissedAlert(alertDeal.id)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-sm"
            >
              後で確認
            </button>
          </div>
        </div>
      )}

      {dealsWithDays.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">検討中の案件はありません</p>
        </div>
      ) : (
        <>
          {/* モバイル: カード表示 */}
          <div className="sm:hidden space-y-2">
            {dealsWithDays.map((deal) => {
              const style = getRowStyle(deal.daysRemaining);
              return (
                <div
                  key={deal.id}
                  onClick={() => router.push(`/deals/${deal.id}`)}
                  className={`rounded-xl shadow-sm p-4 cursor-pointer border-l-4 ${style.bg} ${
                    deal.daysRemaining <= 14 ? 'border-red-400' : deal.daysRemaining <= 30 ? 'border-yellow-400' : 'border-green-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{deal.customer_name}</p>
                    <span className={`text-sm font-bold ${style.text}`}>{deal.daysRemaining}日</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
                    <span>担当：{getUserName(deal.assigned_to)}</span>
                    <span>退職予定：{formatDate(deal.retirement_date)}</span>
                    {deal.memo && <span className="col-span-2 truncate">メモ：{deal.memo}</span>}
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">顧客名</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">担当</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">退職予定日</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">残り日数</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">メモ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dealsWithDays.map((deal) => {
                  const style = getRowStyle(deal.daysRemaining);
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => router.push(`/deals/${deal.id}`)}
                      className={`cursor-pointer hover:bg-gray-100 transition ${style.bg}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{deal.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{getUserName(deal.assigned_to)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDate(deal.retirement_date)}</td>
                      <td className={`px-6 py-4 text-sm font-bold ${style.text}`}>{deal.daysRemaining}日</td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate max-w-xs">{deal.memo || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
