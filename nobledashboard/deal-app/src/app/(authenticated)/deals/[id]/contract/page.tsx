'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  STATUS_CONFIG,
  VALID_TRANSITIONS,
  type DealStatus,
} from '@/lib/types';
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/format';
import { getDeal } from '@/lib/supabase';
import { updateDealById } from '@/lib/deals-api';
import { useMasterData } from '@/lib/useMasterData';
import { useCurrentUser } from '@/lib/useCurrentUser';

interface ContractPageProps {
  params: {
    id: string;
  };
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
  '沖縄県',
];

export default function ContractPage({ params }: ContractPageProps) {
  const router = useRouter();
  const { role, isLoading: userLoading } = useCurrentUser();
  const { users, plans, sources, agencies } = useMasterData();
  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? id ?? '-';
  const getPlanName = (code?: string) => plans.find((p) => p.code === code)?.name ?? code ?? '-';
  const getAgencyName = (code?: string) => agencies.find((a) => a.code === code)?.name ?? code ?? '-';
  const getSourceName = (code?: string) => sources.find((s) => s.code === code)?.name ?? code ?? '-';

  // 営業部は閲覧のみ
  const isReadOnly = role === 'sales';

  const [deal, setDeal] = useState<Record<string, any> | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
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

  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!deal) return;
    setPostalCode(deal.address?.split(' ')[0] || '');
    setContractDate(deal.contract_date || '');
  }, [deal]);

  if (dealLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

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

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }
    setPostalCode(value);
    setErrorMessage('');
  };

  const handleComplete = () => {
    if (isReadOnly) {
      setErrorMessage('営業部は編集できません。管理者にお問い合わせください。');
      return;
    }

    if (!postalCode || !prefecture || !city || !address || !contractDate) {
      setErrorMessage('すべての項目を入力してください。');
      return;
    }

    (async () => {
      setIsSaving(true);
      const payload = {
        address: `${postalCode} ${prefecture}${city}${address}`,
        contract_date: contractDate,
        contract_confirmation: '完了',
        status: 'CONTRACT_SIGNED',
        updated_at: new Date().toISOString(),
      };
      try {
        const updated = await updateDealById(deal.id, payload);
        if (!updated) {
          throw new Error('保存後のデータを取得できませんでした');
        }
        setDeal((prev) => (prev ? { ...prev, ...updated } : prev));
        setErrorMessage('');
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/deals/${params.id}`);
        }, 1500);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '保存に失敗しました');
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    })();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">締結画面</h1>
        <p className="text-sm text-gray-600 mt-2">ID: {deal.id} - {deal.customer_name}</p>
      </div>

      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium">⚠️ 営業部は閲覧のみです。編集は管理者のみが可能です。</p>
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">契約締結が完了しました</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* 郵便番号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                郵便番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={postalCode}
                onChange={handlePostalCodeChange}
                placeholder="000-0000"
                maxLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>

            {/* 都道府県 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                都道府県 <span className="text-red-500">*</span>
              </label>
              <select
                disabled={isReadOnly}
                value={prefecture}
                onChange={(e) => {
                  setPrefecture(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>

            {/* 市区町村 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                市区町村 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="例: 中央区"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>

            {/* 番地 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                番地 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="例: 1-2-3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* 締結日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              締結日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              disabled={isReadOnly}
              value={contractDate}
              onChange={(e) => {
                setContractDate(e.target.value);
                setErrorMessage('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              戻る
            </button>
            <button
              type="button"
              disabled={isReadOnly || isSaving}
              onClick={handleComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '締結完了'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
