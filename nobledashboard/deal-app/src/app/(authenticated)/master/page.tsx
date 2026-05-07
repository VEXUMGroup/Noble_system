'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/mock-data';
import {
  type MUser,
  type MSource,
  type MPlan,
  type MAgency,
  getSources,
  getPlans,
  getAgencies,
  getUsers,
  createSource,
  createPlan,
  createAgency,
  createUser,
  deleteSource,
  deletePlan,
  deleteAgency,
  deleteUser,
  nextUserId,
} from '@/lib/supabase';

type TabType = 'sources' | 'plans' | 'agencies' | 'users';

const roleLabels: Record<MUser['role'], string> = {
  sales: '営業',
  admin_staff: '事務',
  manager: '管理者',
};

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('sources');

  // 一覧データ
  const [sources, setSources] = useState<MSource[]>([]);
  const [plans, setPlans] = useState<MPlan[]>([]);
  const [agencies, setAgencies] = useState<MAgency[]>([]);
  const [users, setUsers] = useState<MUser[]>([]);

  // ローディング・エラー
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // モーダル
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    price: '',
    contact: '',
    email: '',
    role: 'sales' as MUser['role'],
  });
  const [errorMessage, setErrorMessage] = useState('');

  // ===============================================
  // 初期ロード
  // ===============================================
  const loadAll = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [s, p, a, u] = await Promise.all([
        getSources(false),
        getPlans(false),
        getAgencies(false),
        getUsers(false),
      ]);
      setSources(s);
      setPlans(p);
      setAgencies(a);
      setUsers(u);
    } catch (e) {
      console.error(e);
      setLoadError('マスタデータの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ===============================================
  // 追加モーダル
  // ===============================================
  const handleAddClick = () => {
    setFormData({ code: '', name: '', price: '', contact: '', email: '', role: 'sales' });
    setErrorMessage('');
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setErrorMessage('');
    setShowAddModal(false);
  };

  const handleSave = async () => {
    setErrorMessage('');

    // ── 担当者タブ
    if (activeTab === 'users') {
      if (!formData.name.trim() || !formData.email.trim()) {
        setErrorMessage('名前とメールアドレスは必須です。');
        return;
      }
      setIsSaving(true);
      try {
        const newId = await nextUserId();
        const { data: created, error } = await createUser({
          id: newId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          is_active: true,
        });
        if (!created) {
          setErrorMessage(`担当者の登録に失敗しました：${error ?? '不明なエラー'}`);
          return;
        }
        setShowAddModal(false);
        // DBから再読込して永続化を検証
        await loadAll();
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // ── 共通バリデーション
    if (!formData.code.trim() || !formData.name.trim()) {
      setErrorMessage('コードと名称は必須です。');
      return;
    }

    setIsSaving(true);
    try {
      if (activeTab === 'plans') {
        const price = Number(formData.price);
        if (Number.isNaN(price) || price <= 0) {
          setErrorMessage('価格は正しい数値を入力してください。');
          return;
        }
        const { data: created, error } = await createPlan({
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: `${formData.name.trim()}の追加プラン`,
          price,
          is_active: true,
        });
        if (!created) {
          setErrorMessage(`プランの登録に失敗しました：${error ?? '不明なエラー'}`);
          return;
        }
      } else if (activeTab === 'agencies') {
        const { data: created, error } = await createAgency({
          code: formData.code.trim(),
          name: formData.name.trim(),
          contact: formData.contact.trim() || null,
          is_active: true,
        });
        if (!created) {
          setErrorMessage(`代理店の登録に失敗しました：${error ?? '不明なエラー'}`);
          return;
        }
      } else {
        // sources
        const { data: created, error } = await createSource({
          code: formData.code.trim(),
          name: formData.name.trim(),
          is_active: true,
        });
        if (!created) {
          setErrorMessage(`流入経路の登録に失敗しました：${error ?? '不明なエラー'}`);
          return;
        }
      }
      setShowAddModal(false);
      // DBから再読込して永続化を検証
      await loadAll();
    } finally {
      setIsSaving(false);
    }
  };

  // ===============================================
  // 削除
  // ===============================================
  const handleDelete = async (
    target: TabType,
    key: string,
    label: string
  ) => {
    if (!window.confirm(`「${label}」を削除しますか？`)) return;
    if (target === 'sources') {
      const ok = await deleteSource(key);
      if (ok) setSources((prev) => prev.filter((s) => s.code !== key));
      else alert('削除に失敗しました（参照されている可能性）');
    } else if (target === 'plans') {
      const ok = await deletePlan(key);
      if (ok) setPlans((prev) => prev.filter((p) => p.code !== key));
      else alert('削除に失敗しました（参照されている可能性）');
    } else if (target === 'agencies') {
      const ok = await deleteAgency(key);
      if (ok) setAgencies((prev) => prev.filter((a) => a.code !== key));
      else alert('削除に失敗しました（参照されている可能性）');
    } else {
      const ok = await deleteUser(key);
      if (ok) setUsers((prev) => prev.filter((u) => u.id !== key));
      else alert('削除に失敗しました（参照されている可能性）');
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setErrorMessage('');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ===============================================
  // スタイル
  // ===============================================
  const tabClass = (tab: TabType) =>
    `px-4 sm:px-6 py-2 rounded-full font-medium text-sm transition ${
      activeTab === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const deleteBtnClass =
    'text-xs px-2 py-1 rounded-md text-red-600 border border-red-200 hover:bg-red-50 transition';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">マスタ管理</h1>
        <button
          onClick={loadAll}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          再読み込み
        </button>
      </div>

      {loadError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

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
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        {isLoading ? (
          <p className="text-sm text-gray-500 py-8 text-center">読み込み中…</p>
        ) : (
          <>
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
                        <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-gray-900">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sources.length === 0 && (
                        <tr><td colSpan={3} className="px-3 sm:px-6 py-6 text-center text-sm text-gray-400">データがありません</td></tr>
                      )}
                      {sources.map((source) => (
                        <tr key={source.code} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{source.code}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{source.name}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                            <button
                              onClick={() => handleDelete('sources', source.code, source.name)}
                              className={deleteBtnClass}
                            >
                              削除
                            </button>
                          </td>
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
                        <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-gray-900">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {plans.length === 0 && (
                        <tr><td colSpan={4} className="px-3 sm:px-6 py-6 text-center text-sm text-gray-400">データがありません</td></tr>
                      )}
                      {plans.map((plan) => (
                        <tr key={plan.code} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{plan.code}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{plan.name}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{formatCurrency(plan.price)}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                            <button
                              onClick={() => handleDelete('plans', plan.code, plan.name)}
                              className={deleteBtnClass}
                            >
                              削除
                            </button>
                          </td>
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
                        <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-gray-900">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {agencies.length === 0 && (
                        <tr><td colSpan={4} className="px-3 sm:px-6 py-6 text-center text-sm text-gray-400">データがありません</td></tr>
                      )}
                      {agencies.map((agency) => (
                        <tr key={agency.code} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{agency.code}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{agency.name}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{agency.contact || '-'}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                            <button
                              onClick={() => handleDelete('agencies', agency.code, agency.name)}
                              className={deleteBtnClass}
                            >
                              削除
                            </button>
                          </td>
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
                        <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-sm font-semibold text-gray-900">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.length === 0 && (
                        <tr><td colSpan={5} className="px-3 sm:px-6 py-6 text-center text-sm text-gray-400">データがありません</td></tr>
                      )}
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
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                            <button
                              onClick={() => handleDelete('users', user.id, user.name)}
                              className={deleteBtnClass}
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
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
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
              >
                {isSaving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
