'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RESULT_STATUS_TO_DEAL_STATUS } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/format';
import {
  consideringReasons,
  outOfScopeReasons,
  lostReasons,
  hrProposalOptions,
  hrFeasibilityOptions,
} from '@/lib/constants';
import { useMasterData } from '@/lib/useMasterData';
import { getDeal } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import AgencySearchSelect from '@/components/ui/AgencySearchSelect';

interface DealDetailPageProps {
  params: { id: string };
}

export default function DealDetailPage({ params }: DealDetailPageProps) {
  const router = useRouter();
  const { users, sources, agencies, statuses } = useMasterData();
  const interviewStatuses = statuses.filter(s => s.code.startsWith('ST_')).map(s => s.name);
  const resultStatuses = statuses.filter(s => s.code.startsWith('RS_')).map(s => s.name);
  const [deal, setDeal] = useState<Record<string, any> | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [dealError, setDealError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setDealLoading(true);
    setDealError('');
    (async () => {
      const data = await getDeal(params.id);
      if (cancelled) return;
      if (!data) {
        setDeal(null);
        setDealError('商談が見つかりません。');
      } else {
        setDeal(data as any);
      }
      setDealLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // ローカルでステータスを管理（モックデータ変更をUIに即反映するため）
  const [dealStatus, setDealStatus] = useState('NEW');
  useEffect(() => {
    if (deal?.status) setDealStatus(deal.status);
  }, [deal?.status]);

  // 面談記録フォームの状態（NEW のとき表示）
  const [interviewStatus, setInterviewStatus] = useState('');
  const [interviewError, setInterviewError] = useState('');

  // 結果入力フォームの状態（INTERVIEWED のとき表示）
  const [resultStatus, setResultStatus] = useState('');
  const [consideringReason, setConsideringReason] = useState('');
  const [consideringComment, setConsideringComment] = useState('');
  const [outOfScopeReason, setOutOfScopeReason] = useState('');
  const [outOfScopeComment, setOutOfScopeComment] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [lostComment, setLostComment] = useState('');
  const [hrProposal, setHrProposal] = useState('');
  const [hrFeasibility, setHrFeasibility] = useState('');
  const [hrTarget28m, setHrTarget28m] = useState(false);
  const [nextActionDate, setNextActionDate] = useState('');
  const [resultError, setResultError] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ── 顧客詳細編集フォームの状態
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editDealDate, setEditDealDate] = useState('');
  const [editRetirementDate, setEditRetirementDate] = useState('');
  const [editSourceCode, setEditSourceCode] = useState('');
  const [editAgencyCode, setEditAgencyCode] = useState('');
  const [editMemo, setEditMemo] = useState('');

  useEffect(() => {
    if (!deal) return;
    setEditCustomerName(deal.customer_name ?? '');
    setEditAssignedTo(deal.assigned_to ?? '');
    setEditDealDate(deal.deal_date ?? '');
    setEditRetirementDate(deal.retirement_date ?? '');
    setEditSourceCode(deal.source ?? '');
    setEditAgencyCode(deal.agency_code ?? '');
    setEditMemo(deal.memo ?? '');
  }, [deal]);

  if (dealLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">商談詳細</h1>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">商談詳細</h1>
        <p className="text-gray-600 mb-6">{dealError || '商談が見つかりません。'}</p>
        <Link href="/deals" className="text-blue-600 hover:text-blue-700">商談一覧へ戻る</Link>
      </div>
    );
  }

  // ── 面談記録を保存（NEW → INTERVIEWED or NEW のまま）
  const handleSaveInterview = () => {
    if (!interviewStatus) {
      setInterviewError('面談ステータスを選択してください');
      return;
    }
    const newStatus = interviewStatus === '面談実施' ? 'INTERVIEWED' : 'NEW';
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const payload = {
        interview_status: interviewStatus,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('deals').update(payload).eq('id', deal.id);
      if (error) {
        setInterviewError(error.message);
        return;
      }
      setDeal((prev) => (prev ? { ...prev, ...payload } : prev));
      setDealStatus(newStatus);
      setInterviewError('');
      setSuccessMessage('面談記録を保存しました');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    })();
  };

  // ── 結果を保存（INTERVIEWED / CONSIDERING → 成約/検討/対象外/失注）
  const handleSaveResult = () => {
    if (!resultStatus) {
      setResultError('結果ステータスを選択してください');
      return;
    }
    const mappedStatus = RESULT_STATUS_TO_DEAL_STATUS[resultStatus];
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const payload: Record<string, unknown> = {
        result_status: resultStatus,
        status: mappedStatus,
        hr_proposal: hrProposal || null,
        hr_feasibility: hrFeasibility || null,
        hr_target_28m: hrTarget28m || null,
        next_action_date: nextActionDate || null,
        considering_reason: null,
        considering_reason_comment: null,
        out_of_scope_reason: null,
        out_of_scope_reason_comment: null,
        lost_reason: null,
        lost_reason_comment: null,
        updated_at: new Date().toISOString(),
      };
      if (resultStatus === '検討') {
        payload.considering_reason = consideringReason || null;
        payload.considering_reason_comment = consideringComment || null;
      }
      if (resultStatus === '対象外') {
        payload.out_of_scope_reason = outOfScopeReason || null;
        payload.out_of_scope_reason_comment = outOfScopeComment || null;
      }
      if (resultStatus === '失注') {
        payload.lost_reason = lostReason || null;
        payload.lost_reason_comment = lostComment || null;
      }
      const { error } = await supabase.from('deals').update(payload).eq('id', deal.id);
      if (error) {
        setResultError(error.message);
        return;
      }
      setDeal((prev) => (prev ? { ...prev, ...payload } : prev));
      setDealStatus(mappedStatus);
      setResultError('');
      setSuccessMessage(`結果「${resultStatus}」を保存しました`);
      setShowSuccess(true);
    })();

    if (resultStatus === '成約') {
      setTimeout(() => router.push(`/deals/${deal.id}/contract-detail`), 1200);
    } else {
      setTimeout(() => setShowSuccess(false), 2500);
    }
  };

  // ── 顧客詳細を保存
  const handleSaveCustomer = () => {
    if (!editCustomerName.trim()) {
      setInterviewError('顧客名を入力してください');
      return;
    }
    if (!editAssignedTo) {
      setInterviewError('担当者を選択してください');
      return;
    }
    if (!editDealDate) {
      setInterviewError('商談日を選択してください');
      return;
    }
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const payload = {
          customer_name: editCustomerName.trim(),
          assigned_to: editAssignedTo,
          deal_date: editDealDate,
          retirement_date: editRetirementDate || null,
          source: editSourceCode || null,
          agency_code: editAgencyCode || null,
          memo: editMemo || null,
          updated_at: new Date().toISOString(),
        };
        console.log('Saving deal with payload:', payload);
        const { data, error } = await supabase.from('deals').update(payload).eq('id', deal.id).select();
        if (error) {
          console.error('Update error:', error);
          setInterviewError(`保存に失敗しました: ${error.code} - ${error.message}`);
          return;
        }
        console.log('Update successful:', data);
        setDeal((prev) => (prev ? { ...prev, ...payload } : prev));
        setIsEditing(false);
        setInterviewError('');
        setSuccessMessage('顧客詳細を保存しました');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
      } catch (err) {
        console.error('Exception during save:', err);
        setInterviewError(`保存中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
  };

  // ── 編集キャンセル（元の値に戻す）
  const handleCancelEdit = () => {
    setEditCustomerName(deal.customer_name);
    setEditAssignedTo(deal.assigned_to);
    setEditDealDate(deal.deal_date);
    setEditRetirementDate(deal.retirement_date);
    setEditSourceCode(deal.source ?? '');
    setEditAgencyCode(deal.agency_code ?? '');
    setEditMemo(deal.memo ?? '');
    setIsEditing(false);
  };

  const selectClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectErrorClass = 'w-full px-3 py-2 border border-red-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400';
  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const isContractedOrLater = ['CONTRACTED', 'DETAIL_ENTERED', 'APPROVED', 'CONTRACT_SIGNED', 'PAYMENT_MANAGING', 'COMPLETED'].includes(dealStatus);
  const isDetailEnteredOrLater = ['DETAIL_ENTERED', 'APPROVED', 'CONTRACT_SIGNED', 'PAYMENT_MANAGING', 'COMPLETED'].includes(dealStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">商談詳細</h1>
          <p className="text-xs text-gray-400 mt-1">{deal.id}</p>
        </div>
        <Link href="/deals" className="text-sm text-blue-600 hover:text-blue-700">← 商談一覧</Link>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✓ {successMessage}</p>
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">顧客名</p>
            {isEditing ? (
              <input
                type="text"
                value={editCustomerName}
                onChange={(e) => setEditCustomerName(e.target.value)}
                className="text-xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-xl font-bold text-gray-900">{deal.customer_name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={dealStatus} />
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                編集
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          /* ── 編集モード ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">担当者</label>
                <select value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} className={inputClass}>
                  <option value="">-- 未選択 --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">商談日</label>
                <input type="date" value={editDealDate} onChange={(e) => setEditDealDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">退職予定日</label>
                <input type="date" value={editRetirementDate} onChange={(e) => setEditRetirementDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">流入経路</label>
                <select value={editSourceCode} onChange={(e) => setEditSourceCode(e.target.value)} className={inputClass}>
                  <option value="">-- 未選択 --</option>
                  {sources.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">代理店</label>
                <AgencySearchSelect
                  value={editAgencyCode}
                  onChange={(code) => setEditAgencyCode(code)}
                  agencies={agencies}
                  placeholder="-- なし --"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">メモ</label>
              <textarea value={editMemo} onChange={(e) => setEditMemo(e.target.value)} rows={3} placeholder="備考・メモ" className={inputClass} />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveCustomer}
                disabled={!editCustomerName.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition disabled:opacity-50"
              >
                保存する
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-5 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          /* ── 表示モード ── */
          <dl className="divide-y divide-gray-100">
            {[
              ['担当者', users.find(u => u.id === deal.assigned_to)?.name ?? deal.assigned_to ?? '-'],
              ['商談日', formatDate(deal.deal_date)],
              ['退職予定日', deal.retirement_date],
              ['流入経路', sources.find(s => s.code === (deal.source))?.name ?? deal.source ?? '-'],
              ['代理店', agencies.find(a => a.code === deal.agency_code)?.name ?? deal.agency_code ?? '-'],
              ['メモ', deal.memo || '-'],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-3">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="sm:col-span-2 text-sm text-gray-900">{value}</dd>
              </div>
            ))}

            {deal.interview_status && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-3">
                <dt className="text-sm font-medium text-gray-500">面談ステータス</dt>
                <dd className="sm:col-span-2 text-sm text-gray-900">{deal.interview_status}</dd>
              </div>
            )}
            {deal.result_status && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-3">
                <dt className="text-sm font-medium text-gray-500">結果</dt>
                <dd className="sm:col-span-2 text-sm font-medium text-gray-900">{deal.result_status}</dd>
              </div>
            )}
            {deal.hr_proposal && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-3">
                <dt className="text-sm font-medium text-gray-500">人材提案</dt>
                <dd className="sm:col-span-2 text-sm text-gray-900">
                  {deal.hr_proposal}
                  {deal.hr_feasibility && ` ／ ${deal.hr_feasibility}`}
                  {deal.hr_target_28m && ' ／ 28ヶ月対象'}
                </dd>
              </div>
            )}
          </dl>
        )}

        {/* 成約以降のアクションリンク */}
        {!isEditing && isContractedOrLater && (
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
            <Link
              href={`/deals/${deal.id}/contract-detail`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              成約詳細を入力
            </Link>
            {isDetailEnteredOrLater && (
              <Link
                href={`/deals/${deal.id}/approval`}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                事務承認
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── STEP 1: 面談記録（NEW のとき） ── */}
      {dealStatus === 'NEW' && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-purple-400">
          <h2 className="text-base font-bold text-gray-900 mb-1">面談結果を記録する</h2>
          <p className="text-xs text-gray-500 mb-4">面談が完了したら、ステータスを更新してください。</p>

          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                面談ステータス <span className="text-red-500">*</span>
              </label>
              <select
                value={interviewStatus}
                onChange={(e) => { setInterviewStatus(e.target.value); setInterviewError(''); }}
                className={interviewError ? selectErrorClass : selectClass}
              >
                <option value="">-- 選択してください --</option>
                {interviewStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {interviewError && <p className="text-red-500 text-xs mt-1">{interviewError}</p>}
            </div>

            <button
              onClick={handleSaveInterview}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm transition"
            >
              記録する
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: 結果入力（INTERVIEWED / CONSIDERING のとき） ── */}
      {(dealStatus === 'INTERVIEWED' || dealStatus === 'CONSIDERING') && (
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <h2 className="text-base font-bold text-gray-900 mb-1">
            {dealStatus === 'CONSIDERING' ? 'ステータスを変更する' : '面談結果を入力する'}
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            {dealStatus === 'CONSIDERING'
              ? '成約・対象外・失注のいずれかに変更できます。'
              : '成約・検討・対象外・失注のいずれかを選択してください。'}
          </p>

          <div className="space-y-5">
            {/* 結果ステータス */}
            <div className="max-w-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                結果 <span className="text-red-500">*</span>
              </label>
              <select
                value={resultStatus}
                onChange={(e) => { setResultStatus(e.target.value); setResultError(''); }}
                className={resultError ? selectErrorClass : selectClass}
              >
                <option value="">-- 選択してください --</option>
                {(dealStatus === 'CONSIDERING'
                  ? resultStatuses.filter((s) => s !== '検討')
                  : resultStatuses
                ).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {resultError && <p className="text-red-500 text-xs mt-1">{resultError}</p>}
            </div>

            {/* 検討理由 */}
            {resultStatus === '検討' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3 max-w-lg">
                <p className="text-xs font-bold text-yellow-800">検討理由</p>
                <select
                  value={consideringReason}
                  onChange={(e) => setConsideringReason(e.target.value)}
                  className={selectClass}
                >
                  <option value="">-- 選択 --</option>
                  {consideringReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <textarea
                  value={consideringComment}
                  onChange={(e) => setConsideringComment(e.target.value)}
                  placeholder="補足コメント（任意）"
                  rows={2}
                  className={selectClass}
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">次回アクション日</label>
                  <input
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className={selectClass}
                  />
                </div>
              </div>
            )}

            {/* 対象外理由 */}
            {resultStatus === '対象外' && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 max-w-lg">
                <p className="text-xs font-bold text-gray-700">対象外理由</p>
                <select
                  value={outOfScopeReason}
                  onChange={(e) => setOutOfScopeReason(e.target.value)}
                  className={selectClass}
                >
                  <option value="">-- 選択 --</option>
                  {outOfScopeReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <textarea
                  value={outOfScopeComment}
                  onChange={(e) => setOutOfScopeComment(e.target.value)}
                  placeholder="補足コメント（任意）"
                  rows={2}
                  className={selectClass}
                />
              </div>
            )}

            {/* 失注理由 */}
            {resultStatus === '失注' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-3 max-w-lg">
                <p className="text-xs font-bold text-rose-800">失注理由</p>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className={selectClass}
                >
                  <option value="">-- 選択 --</option>
                  {lostReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <textarea
                  value={lostComment}
                  onChange={(e) => setLostComment(e.target.value)}
                  placeholder="補足コメント（任意）"
                  rows={2}
                  className={selectClass}
                />
              </div>
            )}

            {/* 人材提案（結果選択後に表示） */}
            {resultStatus && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-lg">
                <p className="text-xs font-bold text-blue-800 mb-3">人材提案</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">対象区分</label>
                    <select value={hrProposal} onChange={(e) => setHrProposal(e.target.value)} className={selectClass}>
                      <option value="">-- 未選択 --</option>
                      {hrProposalOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">可否</label>
                    <select value={hrFeasibility} onChange={(e) => setHrFeasibility(e.target.value)} className={selectClass}>
                      <option value="">-- 未選択 --</option>
                      {hrFeasibilityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 mt-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={hrTarget28m}
                    onChange={(e) => setHrTarget28m(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  28ヶ月対象
                </label>
              </div>
            )}

            <button
              onClick={handleSaveResult}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition"
            >
              {resultStatus === '成約' ? '保存して成約詳細へ →' : '結果を保存する'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
