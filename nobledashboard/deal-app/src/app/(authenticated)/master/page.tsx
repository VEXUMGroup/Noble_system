'use client';

import { useState } from 'react';
import {
  mockUsers,
  mockPlans,
  mockSources,
  mockAgencies,
  formatCurrency,
  type User,
  type Plan,
  type Source,
  type Agency,
} from '@/lib/mock-data';

type TabType = 'sources' | 'plans' | 'agencies' | 'users';

const roleLabels: Record<User['role'], string> = {
  sales: '営業',
  admin_staff: '事務',
  manager: '管理者',
};

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('sources');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    price: '',
    contact: '',
    email: '',
    role: 'sales' as User['role'],
  });
  const [sources, setSources] = useState([...mockSources]);
  const [plans, setPlans] = useState([...mockPlans]);
  const [agencies, setAgencies] = useState([...mockAgencies]);
  const [users, setUsers] = useState([...mockUsers]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddClick = () => {
    setFormData({ code: '', name: '', price: '', contact: '', email: '', role: 'sales' });
    setErrorMessage('');
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setErrorMessage('');
    setShowAddModal(false);
  };

  const handleSave = () => {
    if (activeTab === 'users') {
      if (!formData.name.trim() || !formData.email.trim()) {
        setErrorMessage('名前とメールアドレスは必須です。');
        return;
      }
      const newId = `u${String(mockUsers.length + 1).padStart(3, '0')}`;
      const nextUser: User = {
        id: newId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };
      mockUsers.push(nextUser);
      setUsers([...mockUsers]);
    } else {
      if (!formData.code.trim() || !formData.name.trim()) {
        setErrorMessage('コードと名称は必須です。');
        return;
      }

      if (activeTab === 'plans') {
        const price = Number(formData.price);
        if (Number.isNaN(price) || price <= 0) {
          setErrorMessage('価格は正しい数値を入力してください。');
          return;
        }
        const nextPlan: Plan = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: `${formData.name.trim()}の追加プラン`,
          price,
        };
        mockPlans.push(nextPlan);
        setPlans([...mockPlans]);
      } else if (activeTab === 'agencies') {
        const nextAgency: Agency = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          contact: formData.contact.trim() || undefined,
        };
        mockAgencies.push(nextAgency);
        setAgencies([...mockAgencies]);
      } else {
        const nextSource: Source = {
          code: formData.code.trim(),
          name: formData.name.trim(),
        };
        mockSources.push(nextSource);
        setSources([...mockSources]);
      }
    }

    setErrorMessage('');
    setShowAddModal(false);
  };

  const handleFormChange = (field: string, value: string) => {
    setErrorMessage('');
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tabClass = (tab: TabType) =>
    `px-4 sm:px-6 py-2 rounded-full font-medium text-sm transition ${
      activeTab === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">マスタ管理</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button onClick={() => setActiveTab('sources')} className={tabClass('sources')}>
          流入経路
        </button>
        <button onClick={() => setActiveTab('plans')} className={tabClass('plans')}>
          成約プラン
        </button>
        <button onClick={() => setActiveTab('agencies')} className={tabClass('agencies')}>
          代理店
        </button>
        <button onClick={() => setActiveTab('users')} className={tabClass('users')}>
          担当者
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">

        {/* Tab: Sources */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm">
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
                  {sources.map((source) => (
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

        {/* Tab: Plans */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm">
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
                  {plans.map((plan) => (
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

        {/* Tab: Agencies */}
        {activeTab === 'agencies' && (
          <div className="space-y-4">
            <button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm">
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
                  {agencies.map((agency) => (
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

        {/* Tab: Users (担当者マスタ) */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition text-sm">
              + 担当者を追加
            </button>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">名前</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">メールアドレス</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">ロール</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-500">{user.id}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{user.email}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'manager'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'sales'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {roleLabels[user.role]}
                        </span>
                      </td>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">
              {activeTab === 'users' ? '担当者を追加' : '項目を追加'}
            </h2>
            {errorMessage && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            <div className="space-y-4">
              {/* 担当者タブのフォーム */}
              {activeTab === 'users' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className={inputClass}
                      placeholder="例：田中 太郎"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className={inputClass}
                      placeholder="例：tanaka@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleFormChange('role', e.target.value)}
                      className={inputClass}
                    >
                      <option value="sales">営業</option>
                      <option value="admin_staff">事務</option>
                      <option value="manager">管理者</option>
                    </select>
                  </div>
                </>
              ) : (
                /* その他タブの共通フォーム */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      コード <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleFormChange('code', e.target.value)}
                      className={inputClass}
                      placeholder="コードを入力"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className={inputClass}
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
                        className={inputClass}
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
                        className={inputClass}
                        placeholder="連絡先を入力"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
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
