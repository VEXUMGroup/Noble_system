'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DealStatus, InterviewStatus } from '@/lib/types';
import {
  mockDeals,
  mockUsers,
  mockSources,
  type Deal,
} from '@/lib/mock-data';

interface FormData {
  customer_name: string;
  assigned_to: string;
  deal_date: string;
  deal_month: string;
  source: string;
  retirement_date: string;
  referrer: string;
  agency_type: string;
  prospect_level: string;
  deal_notes: string;
}

export default function NewDealPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    customer_name: '',
    assigned_to: '',
    deal_date: '',
    deal_month: '',
    source: '',
    retirement_date: '',
    referrer: '',
    agency_type: '',
    prospect_level: '',
    deal_notes: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Auto-set deal_month from deal_date
    if (name === 'deal_date' && value) {
      const [year, month] = value.split('-');
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        deal_month: `${year}/${month}`,
      }));
    }
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '必須項目です';
    }
    if (!formData.assigned_to) {
      newErrors.assigned_to = '必須項目です';
    }
    if (!formData.deal_date) {
      newErrors.deal_date = '必須項目です';
    }
    if (!formData.source) {
      newErrors.source = '必須項目です';
    }
    if (!formData.retirement_date) {
      newErrors.retirement_date = '必須項目です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const newDeal: Deal = {
      id: `D-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(mockDeals.length + 1).padStart(3, '0')}`,
      customer_name: formData.customer_name,
      assigned_to: formData.assigned_to,
      deal_date: formData.deal_date,
      deal_month: formData.deal_month,
      source: formData.source,
      interview_status: 'INTERVIEW_DONE' as InterviewStatus,
      status: 'NEW' as DealStatus,
      retirement_date: formData.retirement_date,
      referrer: formData.referrer || undefined,
      agency_type: formData.agency_type || undefined,
      prospect_level: formData.prospect_level || undefined,
      deal_notes: formData.deal_notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDeals.push(newDeal);

    setShowSuccess(true);
    setTimeout(() => {
      router.push('/deals');
    }, 1500);
  };

  const handleCancel = () => {
    router.push('/deals');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">新規商談登録</h1>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">商談を保存しました</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* 氏名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                氏名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="顧客名を入力"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customer_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customer_name && (
                <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>
              )}
            </div>

            {/* 担当 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                担当 <span className="text-red-500">*</span>
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.assigned_to ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.assigned_to && (
                <p className="text-red-500 text-sm mt-1">{errors.assigned_to}</p>
              )}
            </div>

            {/* 商談日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商談日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="deal_date"
                value={formData.deal_date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.deal_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.deal_date && (
                <p className="text-red-500 text-sm mt-1">{errors.deal_date}</p>
              )}
            </div>

            {/* 流入経路 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                流入経路 <span className="text-red-500">*</span>
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.source ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {mockSources.map((source) => (
                  <option key={source.code} value={source.code}>
                    {source.name}
                  </option>
                ))}
              </select>
              {errors.source && (
                <p className="text-red-500 text-sm mt-1">{errors.source}</p>
              )}
            </div>

            {/* 退職予定日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                退職予定日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="retirement_date"
                value={formData.retirement_date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.retirement_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.retirement_date && (
                <p className="text-red-500 text-sm mt-1">{errors.retirement_date}</p>
              )}
            </div>

            {/* 見込み度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                見込み度
              </label>
              <select
                name="prospect_level"
                value={formData.prospect_level}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="見込みあり">見込みあり</option>
                <option value="見込み低">見込み低</option>
                <option value="新規">新規</option>
                <option value="再商談">再商談</option>
              </select>
            </div>

            {/* 紹介者 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                紹介者
              </label>
              <input
                type="text"
                name="referrer"
                value={formData.referrer}
                onChange={handleChange}
                placeholder="紹介者名を入力"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 代理店区分 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                代理店区分
              </label>
              <select
                name="agency_type"
                value={formData.agency_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="新規">新規</option>
                <option value="既存">既存</option>
              </select>
            </div>
          </div>

          {/* 商談内容メモ - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商談内容メモ
            </label>
            <textarea
              name="deal_notes"
              value={formData.deal_notes}
              onChange={handleChange}
              placeholder="商談内容のメモを入力"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
