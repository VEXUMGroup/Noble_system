'use client';

import { useState } from 'react';
import {
  STATUS_CONFIG,
  VALID_TRANSITIONS,
  type DealStatus,
} from '@/lib/types';
import {
  mockDeals,
  mockUsers,
  mockPlans,
  mockSources,
  mockAgencies,
  mockNotifications,
  getUserName,
  getPlanName,
  getAgencyName,
  getSourceName,
  formatCurrency,
  formatDate,
  getDaysUntil,
  currentUser,
  type Deal,
  type Plan,
  type Source,
  type Agency,
} from '@/lib/mock-data';

type TabType = 'sources' | 'plans' | 'agencies';

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('sources');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', price: '', contact: '' });

  const handleAddClick = () => {
    setFormData({ code: '', name: '', price: '', contact: '' });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handleSave = () => {
    // Simple mock save - in real app would update state
    setShowAddModal(false);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">マスタ管理</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm transition ${
            activeTab === 'sources'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          流入経路マスタ
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm transition ${
            activeTab === 'plans'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          成約プランマスタ
        </button>
        <button
          onClick={() => setActiveTab('agencies')}
          className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm transition ${
            activeTab === 'agencies'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          代理店マスタ
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Tab 1: Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <button
              onClick={handleAddClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              + 追加
            </button>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">コード</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">名称</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockSources.map((source) => (
                    <tr key={source.code} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{source.code}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{source.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Plans */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <button
              onClick={handleAddClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              + 追加
            </button>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">コード</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">名称</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">価格</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockPlans.map((plan) => (
                    <tr key={plan.code} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{plan.code}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{plan.name}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{formatCurrency(plan.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Agencies */}
        {activeTab === 'agencies' && (
          <div className="space-y-4">
            <button
              onClick={handleAddClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              + 追加
            </button>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">コード</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">名称</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">連絡先</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockAgencies.map((agency) => (
                    <tr key={agency.code} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{agency.code}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{agency.name}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{agency.contact || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">項目を追加</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">コード</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="コードを入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="名称を入力"
                />
              </div>
              {activeTab === 'plans' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">価格</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="価格を入力"
                  />
                </div>
              )}
              {activeTab === 'agencies' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">連絡先</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => handleFormChange('contact', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="連絡先を入力"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
