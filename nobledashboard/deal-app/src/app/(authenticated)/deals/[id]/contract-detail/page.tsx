'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentPlanOptions, paymentMethodOptions } from '@/lib/constants';
import { useMasterData } from '@/lib/useMasterData';
import { getDeal } from '@/lib/supabase';
import { updateDealById } from '@/lib/deals-api';
import { nullIfEmpty } from '@/lib/deal-write';
import { formatCurrency } from '@/lib/format';

interface ContractDetailPageProps {
  params: {
    id: string;
  };
}

export default function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { plans } = useMasterData();
  const router = useRouter();
  const [deal, setDeal] = useState<Record<string, any> | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('成約詳細を保存しました');
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDealLoading(true);
    (async () => {
      const data = await getDeal(params.id);
      if (!cancelled) setDeal(data as any);
      if (!cancelled) setDealLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // 成約プラン（10/12/18/24/28/30ヶ月 + その他）
  const [contractPlan, setContractPlan] = useState('');
  const [contractPlanOther, setContractPlanOther] = useState(
    ''
  );
  // 支払いプラン（一括 / 分割 / 完全成功）
  const [paymentPlan, setPaymentPlan] = useState('');
  // 支払い方法（銀行振込 / カード / Stripe）
  const [paymentMethod, setPaymentMethod] = useState('');
  // 成約金額
  const [contractAmount, setContractAmount] = useState('');
  // 支払い期限（自由記入）
  const [paymentDeadline, setPaymentDeadline] = useState('');
  // イレギュラー記載（支払い回数、入金者変更など）
  const [irregularNotes, setIrregularNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!deal) return;
    setContractPlan(deal.contract_plan || '');
    setContractPlanOther(deal.contract_plan_other || '');
    setContractAmount(
      typeof deal.amount === 'number' && Number.isFinite(deal.amount)
        ? String(deal.amount)
        : typeof deal.amount === 'string'
          ? deal.amount
          : ''
    );
    setPaymentPlan(deal.payment_plan || '');
    setPaymentMethod(deal.payment_method || '');
    setPaymentDeadline(typeof deal.payment_deadline === 'string' ? deal.payment_deadline : '');
    setIrregularNotes(deal.irregular_notes || '');
  }, [deal]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const goToDealDetail = () => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    router.push(`/deals/${params.id}`);
  };

  const isContractDetailComplete =
    !!contractPlan &&
    (contractPlan !== 'その他' || !!contractPlanOther.trim()) &&
    !!contractAmount.trim() &&
    Number(contractAmount.replace(/,/g, '')) > 0 &&
    !!paymentPlan &&
    !!paymentMethod &&
    !!paymentDeadline.trim();

  const normalizedContractAmount = Number(contractAmount.replace(/,/g, ''));
  const confirmedAmount =
    Number.isFinite(normalizedContractAmount) && normalizedContractAmount > 0
      ? Math.floor(normalizedContractAmount)
      : null;

  if (dealLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">成約詳細入力</h1>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

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
    if (!isContractDetailComplete) {
      setErrorMessage('必須項目をすべて入力してください（「その他」選択時はコメントが必須です）。');
      return;
    }

    const amountValue = Number(contractAmount.replace(/,/g, ''));
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setErrorMessage('料金は1円以上の数値で入力してください。');
      return;
    }

    (async () => {
      const payload = {
        contract_plan: contractPlan,
        contract_plan_other: contractPlan === 'その他' ? contractPlanOther : null,
        amount: Math.floor(amountValue),
        payment_plan: paymentPlan,
        payment_method: paymentMethod,
        payment_deadline: nullIfEmpty(paymentDeadline),
        irregular_notes: irregularNotes || null,
        status: 'DETAIL_ENTERED',
        updated_at: new Date().toISOString(),
      };
      try {
        const updated = await updateDealById(deal.id, payload);
        if (!updated) {
          throw new Error('保存後のデータを取得できませんでした');
        }
        setDeal((prev) => (prev ? { ...prev, ...updated } : prev));
        setErrorMessage('');
        setSuccessMessage('成約詳細を保存しました');
        setShowSuccess(true);
        redirectTimerRef.current = window.setTimeout(() => {
          goToDealDetail();
        }, 1800);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '保存に失敗しました');
        return;
      }
    })();
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-live="polite"
        >
          <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl shadow-emerald-100">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
              ✓
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{successMessage}</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                保存内容を反映しました。商談詳細画面へ戻ります。
              </p>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={goToDealDetail}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                今すぐ戻る
              </button>
            </div>
          </div>
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

          {/* 料金 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              料金 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={contractAmount}
              onChange={(e) => {
                setContractAmount(e.target.value);
                setErrorMessage('');
              }}
              placeholder="例: 330000"
              className={selectClass}
            />
            <p className="mt-1 text-xs text-gray-400">
              入力例: {formatCurrency(330000)}
            </p>
          </div>

          {/* 確認欄 */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">入力内容の確認</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-xs text-gray-500 mb-1">保存先</p>
                <p className="font-medium text-gray-900">deals.amount</p>
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-xs text-gray-500 mb-1">確認表示</p>
                <p className="font-medium text-gray-900">
                  {confirmedAmount ? formatCurrency(confirmedAmount) : '未入力'}
                </p>
              </div>
            </div>
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
              type="date"
              value={paymentDeadline}
              onChange={(e) => {
                setPaymentDeadline(e.target.value);
                setErrorMessage('');
              }}
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
              disabled={!isContractDetailComplete}
              className="px-6 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              確定して保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
