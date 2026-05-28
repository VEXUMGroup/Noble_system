'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/user-context';
import type { DealCustomFieldDefinition, DealCustomFieldType } from '@/lib/custom-fields';

type EditableField = Partial<DealCustomFieldDefinition> & {
  name: string;
  key_name: string;
  field_type: DealCustomFieldType;
  required: boolean;
  order_index: number;
  visible_roles: string[];
  is_active: boolean;
  options_text: string;
};

const ROLE_OPTIONS = [
  { value: 'sales', label: '営業' },
  { value: 'manager', label: '管理者' },
];

const FIELD_TYPE_OPTIONS: { value: DealCustomFieldType; label: string }[] = [
  { value: 'text', label: 'テキスト' },
  { value: 'number', label: '数値' },
  { value: 'date', label: '日付' },
  { value: 'select', label: '単一選択' },
  { value: 'checkbox', label: '複数チェック' },
];

function toOptionsText(optionsJson: unknown): string {
  if (!Array.isArray(optionsJson)) return '';
  return optionsJson.map(String).join('\n');
}

function fromOptionsText(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function buildDefaultField(nextOrderIndex: number): EditableField {
  return {
    name: '',
    key_name: '',
    field_type: 'text',
    required: false,
    order_index: nextOrderIndex,
    visible_roles: ['manager'],
    is_active: true,
    options_text: '',
  };
}

export default function DealCustomFieldsPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const [authChecked, setAuthChecked] = useState(false);
  const [isManager, setIsManager] = useState(false);

  const [rows, setRows] = useState<DealCustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EditableField>(() => buildDefaultField(0));

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const ok = currentUser.role === 'manager';
    setIsManager(ok);
    setAuthChecked(true);
    if (!ok) setTimeout(() => router.push('/deals'), 400);
  }, [currentUser.role, router]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => (a.order_index - b.order_index) || (a.id - b.id));
  }, [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await fetch('/api/custom-fields', { cache: 'no-store' });
      const json = (await res.json().catch(() => null)) as { data?: DealCustomFieldDefinition[]; error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? '読み込みに失敗しました');
      setRows(json?.data ?? []);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : '読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    load();
  }, [authChecked, load]);

  const openAdd = () => {
    const next = (sortedRows.at(-1)?.order_index ?? -1) + 1;
    setEditingId(null);
    setForm(buildDefaultField(next));
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (field: DealCustomFieldDefinition) => {
    setEditingId(field.id);
    setForm({
      id: field.id,
      name: field.name,
      key_name: field.key_name,
      field_type: field.field_type,
      required: Boolean(field.required),
      order_index: field.order_index ?? 0,
      visible_roles: Array.isArray(field.visible_roles) ? (field.visible_roles as string[]) : ['manager'],
      is_active: field.is_active !== false,
      options_text: toOptionsText(field.options_json),
    });
    setFormError('');
    setModalOpen(true);
  };

  const moveRow = async (id: number, dir: -1 | 1) => {
    const list = sortedRows;
    const idx = list.findIndex((r) => r.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx];
    const b = list[swapIdx];
    const next = rows.map((r) => {
      if (r.id === a.id) return { ...r, order_index: b.order_index };
      if (r.id === b.id) return { ...r, order_index: a.order_index };
      return r;
    });
    setRows(next);

    await Promise.all([
      fetch(`/api/custom-fields/${a.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ order_index: b.order_index }),
      }),
      fetch(`/api/custom-fields/${b.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ order_index: a.order_index }),
      }),
    ]).catch(() => null);
    load();
  };

  const save = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (!form.name.trim()) throw new Error('ラベルを入力してください');
      if (!form.key_name.trim()) throw new Error('Key を入力してください');
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        key_name: form.key_name.trim(),
        field_type: form.field_type,
        required: form.required,
        order_index: form.order_index,
        visible_roles: form.visible_roles,
        is_active: form.is_active,
      };
      if (form.field_type === 'select' || form.field_type === 'checkbox') {
        payload.options = fromOptionsText(form.options_text);
      }
      const res = await fetch(editingId ? `/api/custom-fields/${editingId}` : '/api/custom-fields', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as { data?: unknown; error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? '保存に失敗しました');
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: number) => setDeleteId(id);

  const doDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/custom-fields/${deleteId}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? '削除に失敗しました');
      setDeleteId(null);
      await load();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : '削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  if (!isManager) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">商談カスタム項目設定</h1>
          <p className="text-gray-600">権限がありません。リダイレクトします…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">商談カスタム項目設定</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/master')}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            マスタ一覧へ
          </button>
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            追加
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <p className="text-gray-600">読み込み中…</p>
        ) : pageError ? (
          <p className="text-red-600">{pageError}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">ラベル</th>
                  <th className="py-2 pr-4">Key</th>
                  <th className="py-2 pr-4">型</th>
                  <th className="py-2 pr-4 text-center">必須</th>
                  <th className="py-2 pr-4 text-center">有効</th>
                  <th className="py-2 pr-4 text-center">順</th>
                  <th className="py-2 pr-4">表示</th>
                  <th className="py-2 pr-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-2 pr-4 text-gray-700">{r.key_name}</td>
                    <td className="py-2 pr-4 text-gray-700">{r.field_type}</td>
                    <td className="py-2 pr-4 text-center">{r.required ? '✓' : ''}</td>
                    <td className="py-2 pr-4 text-center">{r.is_active ? '✓' : ''}</td>
                    <td className="py-2 pr-4 text-center">{r.order_index}</td>
                    <td className="py-2 pr-4 text-gray-700">
                      {Array.isArray(r.visible_roles) ? (r.visible_roles as string[]).join(', ') : 'manager'}
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <button
                        onClick={() => moveRow(r.id, -1)}
                        className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 mr-2"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveRow(r.id, 1)}
                        className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 mr-3"
                      >
                        ↓
                      </button>
                      <button onClick={() => openEdit(r)} className="text-indigo-600 hover:text-indigo-800 mr-3">
                        編集
                      </button>
                      <button onClick={() => confirmDelete(r.id)} className="text-red-600 hover:text-red-800">
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedRows.length === 0 ? (
                  <tr>
                    <td className="py-6 text-gray-600" colSpan={8}>
                      まだ項目がありません。「追加」から作成してください。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => (saving ? null : setModalOpen(false))} />
          <div className="relative w-[min(720px,92vw)] bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? '項目編集' : '項目追加'}</h2>
              <button
                onClick={() => (saving ? null : setModalOpen(false))}
                className="px-2 py-1 rounded hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">ラベル（日本語）</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Key（英字・アンダースコア）</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 font-mono"
                  value={form.key_name}
                  onChange={(e) => setForm((p) => ({ ...p, key_name: e.target.value }))}
                  placeholder="e.g. contract_type"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">タイプ</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.field_type}
                  onChange={(e) => setForm((p) => ({ ...p, field_type: e.target.value as DealCustomFieldType }))}
                >
                  {FIELD_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.required}
                    onChange={(e) => setForm((p) => ({ ...p, required: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-800">必須</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-800">有効</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">表示順</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.order_index}
                  onChange={(e) => setForm((p) => ({ ...p, order_index: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">表示対象ロール</label>
                <div className="flex gap-4 pt-2">
                  {ROLE_OPTIONS.map((o) => (
                    <label key={o.value} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.visible_roles.includes(o.value)}
                        onChange={(e) => {
                          setForm((p) => {
                            const next = new Set(p.visible_roles);
                            if (e.target.checked) next.add(o.value);
                            else next.delete(o.value);
                            return { ...p, visible_roles: Array.from(next) };
                          });
                        }}
                      />
                      <span className="text-sm text-gray-800">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {(form.field_type === 'select' || form.field_type === 'checkbox') ? (
              <div className="mt-4">
                <label className="block text-sm text-gray-700 mb-1">選択肢（1行=1項目）</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 min-h-[120px] font-mono"
                  value={form.options_text}
                  onChange={(e) => setForm((p) => ({ ...p, options_text: e.target.value }))}
                />
              </div>
            ) : null}

            {formError ? <p className="mt-3 text-sm text-red-600">{formError}</p> : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => (saving ? null : setModalOpen(false))}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => (deleting ? null : setDeleteId(null))} />
          <div className="relative w-[min(520px,92vw)] bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">削除しますか？</h2>
            <p className="text-sm text-gray-700">この項目定義を削除します。商談側の custom_data は自動削除されません。</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => (deleting ? null : setDeleteId(null))}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={doDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? '削除中…' : '削除'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

