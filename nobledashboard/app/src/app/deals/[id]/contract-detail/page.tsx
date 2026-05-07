'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockDeals,
  mockPlans,
  formatCurrency,
  type Deal,
} from '@/lib/mock-data';

interface ContractDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const deal = mockDeals.find((d) => d.id === id);
  const [showSuccess, setShowSuccess] = useState(false);
  const [proposalContent, setProposalContent] = useState(deal?.proposal_content || '');
  const [amount, setAmount] = useState(deal?.amount?.toString() || '');

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">404</h1>
            <p className="text-gray-600">申し訳ございません。該当する商談が見つかりません。</p>
          </div>
        </div>
      </div>
    );
  }

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setProposalContent(code);
    const plan = mockPlans.find((p) => p.code === code);
    if (plan) {
      setAmount(plan.price.toString());
    }
  };

  const handleConfirm = () => {
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${id}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-600 mb-2">成約詳細入力</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{deal.customer_name}</h1>
            <p className="text-sm text-gray-600 mt-2">ID: {deal.id}</p>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">成約詳細を保存しました</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form className="space-y-6">
          {/* 提案内容（プラン選択） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              提案内容（プラン） <span className="text-red-500">*</span>
            </label>
            <select
              value={proposalContent}
              onChange={handlePlanChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {mockPlans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          {/* 成約金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              成約金額 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-gray-600">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="金額を入力"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              確定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
