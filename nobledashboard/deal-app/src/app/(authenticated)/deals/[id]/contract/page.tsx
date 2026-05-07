'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDeal, updateDeal, type DealRow } from '@/lib/supabase';

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
  const [deal, setDeal] = useState<DealRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const row = await getDeal(params.id);
      if (cancelled) return;
      setDeal(row);
      if (row) {
        setPostalCode(row.address?.split(' ')[0] ?? '');
        setContractDate(row.contract_date ?? '');
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  if (isLoading) {
    return <div className="bg-white rounded-xl shadow-sm p-8"><p className="text-gray-500">読み込み中…</p></div>;
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

  const handleComplete = async () => {
    if (!postalCode || !prefecture || !city || !address || !contractDate) {
      setErrorMessage('すべての項目を入力してください。');
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await updateDeal(deal.id, {
        address: `${postalCode} ${prefecture}${city}${address}`,
        contract_date: contractDate,
        contract_confirmation: '完了',
        status: 'CONTRACT_SIGNED',
      });
      if (!data) {
        setErrorMessage(`保存に失敗しました：${error ?? '不明'}`);
        return;
      }
      setErrorMessage('');
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/deals/${params.id}`);
      }, 1500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">締結画面</h1>
        <p className="text-sm text-gray-600 mt-2">ID: {deal.id} - {deal.customer_name}</p>
      </div>

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
                value={postalCode}
                onChange={handlePostalCodeChange}
                placeholder="000-0000"
                maxLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 都道府県 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                都道府県 <span className="text-red-500">*</span>
              </label>
              <select
                value={prefecture}
                onChange={(e) => {
                  setPrefecture(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="例: 中央区"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 番地 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                番地 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="例: 1-2-3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              value={contractDate}
              onChange={(e) => {
                setContractDate(e.target.value);
                setErrorMessage('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onClick={handleComplete}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isSaving ? '保存中…' : '締結完了'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
