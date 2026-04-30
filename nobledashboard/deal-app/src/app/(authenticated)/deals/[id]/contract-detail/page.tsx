'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockDeals,
  paymentPlanOptions,
  paymentMethodOptions,
} from '@/lib/mock-data';
import { useMasterData } from '@/lib/useMasterData';

interface ContractDetailPageProps {
  params: {
    id: string;
  };
}

export default function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { plans } = useMasterData();
  const router = useRouter();
  const deal = mockDeals.find((d) => d.id === params.id);
  const [showSuccess, setShowSuccess] = useState(false);

  // 成約プラン（10/12/18/24/28/30ヶ月 + その他）
  const [contractPlan, setContractPlan] = useState(deal?.contract_plan || '');
  const [contractPlanOther, setContractPlanOther] = useState(
    deal?.contract_plan_other || ''
  );
  // 支払いプラン（一括 / 分割 / 完全成功）
  const [paymentPlan, setPaymentPlan] = useState(deal?.payment_plan || '');
  // 支払い方法（銀行振込 / カード / Stripe）
  const [paymentMethod, setPaymentMethod] = useState(deal?.payment_method || '');
  // 支払い期限（自由記入）
  const [paymentDeadline, setPaymentDeadline] = useState(
    deal?.payment_deadline || ''
  );
  // イレギュラー記載（支払い回数、入金者変更など）
  const [irregularNotes, setIrregularNotes] = useState(deal?.irregular_notes || '');

  const [errorMessage, setErrorMessage] = useState('');

  if (!deal) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">成約詳細入力</h1>
        <p className="text-gray-600 mb-6">商談が見つかりません。</p>
        <button
          onClick={() => router.push('/deals')}
          className="text-blue-600 hover:text-blue-700"
        >
          商談一覧へ戻る
        </button>
      </div>
    );
  }

  const handleConfirm = () => {
    if (
      !contractPlan ||
      (contractPlan === 'その他' && !contractPlanOther.trim()) ||
      !paymentPlan ||
      !paymentMethod ||
      !paymentDeadline.trim()
    ) {
      setErrorMessage('必須項目をすべて入力してください（「その他」選択時はコメントが必須です）。');
      return;
    }

    deal.contract_plan = contractPlan;
    deal.contract_plan_other =
      contractPlan === 'その他' ? contractPlanOther : undefined;
    deal.payment_plan = paymentPlan;
    deal.payment_method = paymentMethod;
    deal.payment_deadline = paymentDeadline;
    deal.irregular_notes = irregularNotes || undefined;
    deal.status = 'DETAIL_ENTERED';
    deal.updated_at = new Date().toISOString();

    setErrorMessage('');
    setShowSuccess(true);
    setTimeout(() => {
      router.push(`/deals/${params.id}`);
    }, 1500);
  };

  const selectClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">成約詳細入力</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{deal.customer_name}</h1>
          <p className="text-xs text-gray-400 mt-1">ID: {deal.id}</p>
        </div>
        <button
          onClick={() => router.push(`/deals/${params.id}`)}
          className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
        >
          ← 商談詳細へ戻る
        </button>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✓ 成約詳細を保存しました</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <form className="space-y-6">

          {/* 成約プラン */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              成約プラン <span className="text-red-500">*</span>
            </label>
            <select
              value={contractPlan}
              onChange={(e) => {
                setContractPlan(e.target.value);
                setErrorMessage('');
              }}
              className={selectClass}
            >
              <option value="">-- 選択してください --</option>
              {plans.map((p) => (
                <option key={p.code} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            {contractPlan === 'その他' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={contractPlanOther}
                  onChange={(e) => {
                    setContractPlanOther(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="「その他」の内容を入力（例：24ヶ月、完全成功型 など）"
                  className={selectClass}
                />
              </div>
            )}
          </div>

          {/* 支払いプラン */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              支払いプラン <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentPlan}
              onChange={(e) => {
                setPaymentPlan(e.target.value);
                setErrorMessage('');
              }}
              className={selectClass}
            >
              <option value="">-- 選択してください --</option>
              {paymentPlanOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 支払い方法 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              支払い方法 <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setErrorMessage('');
              }}
              className={selectClass}
            >
              <option value="">-- 選択してください --</option>
              {paymentMethodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 支払い期限（自由記入） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              支払い期限 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paymentDeadline}
              onChange={(e) => {
                setPaymentDeadline(e.target.value);
                setErrorMessage('');
              }}
              placeholder="自由記入（例：2026年6月末、初診日翌月末、締結後7日以内 など）"
              className={selectClass}
            />
          </div>

          {/* イレギュラー記載 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              イレギュラー記載
              <span className="ml-2 text-xs font-normal text-gray-400">（任意）</span>
            </label>
            <textarea
              value={irregularNotes}
              onChange={(e) => setIrregularNotes(e.target.value)}
              rows={4}
              placeholder="支払い回数、入金者変更、その他通常運用と異なる点があれば記載"
              className={selectClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              例：支払い回数を3回→4回に変更 ／ 入金者が本人から親族に変更 など
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              確定して保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
