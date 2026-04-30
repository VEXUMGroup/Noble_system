'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  fetchMasterData,
  addMasterData,
  updateMasterData,
  softDeleteMasterData,
  isMasterAdmin,
  type MasterTableName,
} from '@/lib/supabase-master';

const supabase = createSupabaseBrowserClient();

// ─────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────
type TabType = MasterTableName;

interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox';
  options?: { value: string; label: string }[];
  required?: boolean;
  displayWidth?: string;
}

// ─────────────────────────────────────────────
// マスタ定義
// ─────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'sales', label: '営業' },
  { value: 'admin_staff', label: '事務' },
  { value: 'manager', label: '管理者' },
];

const CATEGORY_OPTIONS = [
  { value: 'interview', label: '商談ステータス' },
  { value: 'result', label: '結果ステータス' },
  { value: 'contract_confirm', label: '契約確認' },
  { value: 'contract', label: '契約' },
  { value: 'support', label: 'サポート' },
  { value: 'payment', label: '支払い' },
];

const TABLE_COLUMNS: Record<TabType, ColumnDef[]> = {
  m_users: [
    { key: 'id',        label: 'ID',     type: 'text',     required: true },
    { key: 'name',      label: '名前',   type: 'text',     required: true },
    { key: 'email',     label: 'メール', type: 'email',    required: true },
    { key: 'role',      label: 'ロール', type: 'select',   options: ROLE_OPTIONS, required: true },
    { key: 'is_active', label: '有効',   type: 'checkbox' },
  ],
  m_sources: [
    { key: 'code',      label: 'コード', type: 'text', required: true },
    { key: 'name',      label: '名称',   type: 'text', required: true },
    { key: 'is_active', label: '有効',   type: 'checkbox' },
  ],
  m_statuses: [
    { key: 'code',       label: 'コード',     type: 'text',   required: true },
    { key: 'name',       label: '名称',       type: 'text',   required: true },
    { key: 'category',   label: 'カテゴリ',   type: 'select', options: CATEGORY_OPTIONS },
    { key: 'sort_order', label: '表示順',     type: 'number', required: true },
    { key: 'is_active',  label: '有効',       type: 'checkbox' },
  ],
  m_plans: [
    { key: 'code',        label: 'コード', type: 'text',   required: true },
    { key: 'name',        label: '名称',   type: 'text',   required: true },
    { key: 'description', label: '説明',   type: 'text' },
    { key: 'price',       label: '価格',   type: 'number', required: true },
    { key: 'is_active',   label: '有効',   type: 'checkbox' },
  ],
  m_agencies: [
    { key: 'code',            label: 'コード',   type: 'text',   required: true },
    { key: 'name',            label: '名称',     type: 'text',   required: true },
    { key: 'contact',         label: '連絡先',   type: 'text' },
    { key: 'commission_rate', label: '手数料率', type: 'number' },
    { key: 'is_active',       label: '有効',     type: 'checkbox' },
  ],
};

const TABLE_PRIMARY_KEY: Record<TabType, string> = {
  m_users: 'id',
  m_sources: 'code',
  m_statuses: 'code',
  m_plans: 'code',
  m_agencies: 'code',
};

const TAB_LABELS: Record<TabType, string> = {
  m_users: '担当者',
  m_sources: '流入経路',
  m_statuses: 'ステータス',
  m_plans: 'プラン',
  m_agencies: '代理店',
};

// ─────────────────────────────────────────────
// セル表示ヘルパー
// ─────────────────────────────────────────────
function renderCell(col: ColumnDef, value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (col.type === 'checkbox') return value ? '✓' : '✗';
  if (col.type === 'select') {
    return col.options?.find((o) => o.value === String(value))?.label ?? String(value);
  }
  if (col.key === 'commission_rate') return `${(Number(value) * 100).toFixed(0)}%`;
  return String(value);
}

// ─────────────────────────────────────────────
// メインページ
// ─────────────────────────────────────────────
export default function MasterPage() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('m_users');
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // モーダル
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // 削除確認
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── 認証チェック ──
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.push('/');
        return;
      }
      const ok = await isMasterAdmin(user.email ?? '');
      setIsAdmin(ok);
      setAuthChecked(true);
      if (!ok) router.push('/dashboard');
    })();
  }, [router]);

  // ── データ取得 ──
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setPageError('');
    try {
      const data = await fetchMasterData(activeTab);
      setTableData(data);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'データ取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (authChecked) loadData();
  }, [activeTab, authChecked, loadData]);

  // ── 追加モーダルを開く ──
  const openAddModal = () => {
    const defaults: Record<string, unknown> = { is_active: true };
    if (activeTab === 'm_statuses') defaults.sort_order = 0;
    if (activeTab === 'm_plans') defaults.price = 0;
    if (activeTab === 'm_agencies') defaults.commission_rate = 0.25;
    setEditItem(null);
    setFormData(defaults);
    setFormError('');
    setModalOpen(true);
  };

  // ── 編集モーダルを開く ──
  const openEditModal = (item: Record<string, unknown>) => {
    if (!isAdmin) return;
    setEditItem(item);
    setFormData({ ...item });
    setFormError('');
    setModalOpen(true);
  };

  // ── 保存 ──
  const handleSave = async () => {
    const cols = TABLE_COLUMNS[activeTab];
    for (const col of cols) {
      if (col.required && !formData[col.key] && formData[col.key] !== 0) {
        setFormError(`「${col.label}」は必須です`);
        return;
      }
    }
    setSaving(true);
    setFormError('');
    try {
      const pkField = TABLE_PRIMARY_KEY[activeTab];
      if (editItem) {
        await updateMasterData(activeTab, editItem[pkField] as string, formData);
      } else {
        await addMasterData(activeTab, formData);
      }
      setModalOpen(false);
      await loadData();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // ── 論理削除 ──
  const handleDelete = async () => {
    if (!deleteKey) return;
    setDeleting(true);
    try {
      await softDeleteMasterData(activeTab, deleteKey);
      setDeleteKey(null);
      await loadData();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : '削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  // ── 認証確認中 ──
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">認証確認中...</p>
      </div>
    );
  }

  const cols = TABLE_COLUMNS[activeTab];
  const pkField = TABLE_PRIMARY_KEY[activeTab];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">マスタ管理</h1>
          {!isAdmin && (
            <p className="text-xs text-amber-600 mt-1">
              ※ 権限がありません
            </p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
          >
            + 追加
          </button>
        )}
      </div>

      {/* タブ */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* エラー */}
      {pageError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-400 text-sm">読み込み中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {cols.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={cols.length + (isAdmin ? 1 : 0)}
                      className="px-4 py-10 text-center text-gray-400 text-sm"
                    >
                      データがありません
                    </td>
                  </tr>
                ) : (
                  tableData.map((row) => {
                    const pk = String(row[pkField]);
                    const isActive = row.is_active !== false;
                    return (
                      <tr
                        key={pk}
                        onClick={() => isAdmin && openEditModal(row)}
                        className={`hover:bg-blue-50 transition ${
                          isAdmin ? 'cursor-pointer' : ''
                        } ${!isActive ? 'opacity-40' : ''}`}
                      >
                        {cols.map((col) => (
                          <td
                            key={col.key}
                            className="px-4 py-3 text-gray-800 whitespace-nowrap max-w-xs truncate"
                          >
                            {renderCell(col, row[col.key])}
                          </td>
                        ))}
                        {isAdmin && (
                          <td
                            className="px-4 py-3 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isActive && (
                              <button
                                onClick={() => setDeleteKey(pk)}
                                className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                              >
                                無効化
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 追加 / 編集モーダル */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-gray-900">
              {editItem ? '編集' : '追加'} — {TAB_LABELS[activeTab]}
            </h2>
            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              {cols.map((col) => {
                const isReadonly = editItem !== null && col.key === pkField;
                const val = formData[col.key];
                return (
                  <div key={col.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {col.label}
                      {col.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>

                    {isReadonly ? (
                      <p className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                        {String(val ?? '')}
                      </p>
                    ) : col.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!val}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, [col.key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">有効にする</span>
                      </label>
                    ) : col.type === 'select' ? (
                      <select
                        value={String(val ?? '')}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [col.key]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">-- 選択してください --</option>
                        {col.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type}
                        value={String(val ?? '')}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [col.key]:
                              col.type === 'number' ? Number(e.target.value) : e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={col.label}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 無効化確認ダイアログ */}
      {deleteKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-2 text-gray-900">無効化の確認</h2>
            <p className="text-gray-600 text-sm mb-6">
              以下のレコードを無効化しますか？
              <br />
              <span className="font-semibold text-gray-900 mt-1 inline-block">{deleteKey}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteKey(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50"
              >
                {deleting ? '処理中...' : '無効化する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
