'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  isClosingStatus,
  type DealStatus,
} from '@/lib/types';
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
import AgencySearchSelect from '@/components/ui/AgencySearchSelect';
import { validateCustomDataOrThrow, type DealCustomFieldDefinition } from '@/lib/custom-fields';
import { updateDealById } from '@/lib/deals-api';
import {
  getDealProgressFieldLabel,
  getDealProgressValidationMessage,
  validateDealProgressInput,
} from '@/lib/deal-progress-validation';

interface DealDetailPageProps {
  params: { id: string };
}

function sortForStableStringify(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableStringify);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortForStableStringify((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortForStableStringify(value));
}

function normalizeAgeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export default function DealDetailPage({ params }: DealDetailPageProps) {
  const router = useRouter();
  const { users, sources, agencies, statuses } = useMasterData();
  const NO_SOURCE_LABELS = new Set(['流入経路なし', '流入経路無し', '不明', 'なし']);
  const interviewStatusOptions = statuses.filter((s) => s.code.startsWith('ST_'));
  const resultStatusOptions = statuses.filter((s) => s.code.startsWith('RS_'));
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
  const [dealStatus, setDealStatus] = useState<DealStatus | string>('NEW');
  useEffect(() => {
    if (deal?.status) setDealStatus(deal.status);
  }, [deal?.status]);

  // 面談記録フォームの状態（NEW のとき表示）
  const [interviewStatus, setInterviewStatus] = useState('');
  const [interviewError, setInterviewError] = useState('');
  const interviewStatusRef = useRef<HTMLSelectElement | null>(null);

  // 結果入力フォームの状態（INTERVIEWED のとき表示）
  const [resultStatus, setResultStatus] = useState('');
  const resultStatusRef = useRef<HTMLSelectElement | null>(null);
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
  const [transitionError, setTransitionError] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [customerSaveError, setCustomerSaveError] = useState('');
  const [isCustomerSaving, setIsCustomerSaving] = useState(false);

  // ── 顧客詳細編集フォームの状態
  // 詳細画面をそのまま編集フォームとして使うため、初期表示から編集モードにする。
  const [isEditing] = useState(true);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const editAssignedToRef = useRef<HTMLSelectElement | null>(null);
  const [editDealDate, setEditDealDate] = useState('');
  const editDealDateRef = useRef<HTMLInputElement | null>(null);
  const [editRetirementDate, setEditRetirementDate] = useState('');
  const [editSourceCode, setEditSourceCode] = useState('');
  const editSourceCodeRef = useRef<HTMLSelectElement | null>(null);
  const [editAgencyCode, setEditAgencyCode] = useState('');
  const [editResultStatus, setEditResultStatus] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const editEmailRef = useRef<HTMLInputElement | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editProspectLevel, setEditProspectLevel] = useState('');
  const [editAgencyType, setEditAgencyType] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [customFieldDefs, setCustomFieldDefs] = useState<DealCustomFieldDefinition[]>([]);
  const [editCustomData, setEditCustomData] = useState<Record<string, any>>({});
  const editAgeRef = useRef<HTMLInputElement | null>(null);
  const [isCustomerFormReady, setIsCustomerFormReady] = useState(false);
  const customerSaveTimerRef = useRef<number | null>(null);
  const customerSavePromiseRef = useRef<Promise<boolean> | null>(null);
  const persistCustomerChangesRef = useRef<((options?: { silent?: boolean }) => Promise<boolean>) | null>(null);
  const isCustomerFormReadyRef = useRef(false);
  const customerFormHydratedDealIdRef = useRef<string | null>(null);
  const dealRef = useRef<Record<string, any> | null>(null);
  const lastSavedCustomerSnapshotRef = useRef<string>('');

  function normalizeSourceValue(value?: string | null) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) return '';
    if (NO_SOURCE_LABELS.has(trimmed)) return '';
    if (sources.some((s) => s.code === trimmed && NO_SOURCE_LABELS.has(s.name.trim()))) return '';
    return trimmed;
  }

  const getLiveEditValues = () => {
    const assignedTo = editAssignedToRef.current?.value ?? editAssignedTo;
    const dealDate = editDealDateRef.current?.value ?? editDealDate;
    const source = normalizeSourceValue(editSourceCodeRef.current?.value ?? editSourceCode);
    const email = editEmailRef.current?.value ?? editEmail;
    return {
      assigned_to: assignedTo,
      deal_date: dealDate,
      source,
      email,
      referrer: editAgencyCode,
      age: normalizeAgeValue(editAgeRef.current?.value ?? editCustomData?.age),
    };
  };

  const getCurrentDealProgressValidation = () =>
    validateDealProgressInput(
      {
        assigned_to: deal?.assigned_to ?? '',
        deal_date: deal?.deal_date ?? '',
        age: normalizeAgeValue(deal?.custom_data?.age ?? deal?.age),
        email: deal?.email ?? deal?.custom_data?.email ?? '',
        source: normalizeSourceValue(deal?.source),
        referrer: deal?.agency_code ?? deal?.referrer ?? '',
      },
      {
        sourceCodes: sources.map((s) => s.code),
        agencyCodes: agencies.map((a) => a.code),
      }
    );

  const getEditDealProgressValidation = () =>
    validateDealProgressInput(
      {
        ...getLiveEditValues(),
      },
      {
        sourceCodes: sources.map((s) => s.code),
        agencyCodes: agencies.map((a) => a.code),
      }
    );

  const currentDealProgressValidation = getCurrentDealProgressValidation();
  const editDealProgressValidation = getEditDealProgressValidation();
  const currentDealProgressError = getDealProgressValidationMessage(currentDealProgressValidation);
  const editDealProgressError = getDealProgressValidationMessage(editDealProgressValidation);

  const getCustomerSavePayload = () => {
    const liveValues = getLiveEditValues();
    const normalizedSource = normalizeSourceValue(liveValues.source);
    const normalizedReferrer = liveValues.referrer || null;
    const normalizedAge = normalizeAgeValue(editAgeRef.current?.value ?? editCustomData?.age);
    const normalizedEmail = liveValues.email.trim();
    const normalizedPhone = editPhone.trim();
    return {
      customer_name: editCustomerName.trim(),
      assigned_to: liveValues.assigned_to,
      deal_date: liveValues.deal_date,
      retirement_date: editRetirementDate || null,
      source: normalizedSource || null,
      age: normalizedAge || null,
      agency_code: normalizedReferrer,
      result_status: editResultStatus || null,
      email: normalizedEmail || null,
      phone: normalizedPhone || null,
      prospect_level: editProspectLevel || null,
      agency_type: editAgencyType || null,
      memo: editMemo || null,
      custom_data: {
        ...(editCustomData ?? {}),
        age: normalizedAge || undefined,
        email: normalizedEmail || undefined,
        phone: normalizedPhone || undefined,
      },
      updated_at: new Date().toISOString(),
    };
  };

  const getPersistedCustomerSnapshot = () =>
    stableStringify({
      customer_name: deal?.customer_name ?? '',
      assigned_to: deal?.assigned_to ?? '',
      deal_date: deal?.deal_date ?? '',
      retirement_date: deal?.retirement_date ?? '',
      source: normalizeSourceValue(deal?.source),
      age: normalizeAgeValue(deal?.custom_data?.age ?? deal?.age) || '',
      agency_code: deal?.agency_code ?? deal?.referrer ?? '',
      result_status: deal?.result_status ?? '',
      email: deal?.email ?? deal?.custom_data?.email ?? '',
      phone: deal?.phone ?? deal?.custom_data?.phone ?? '',
      prospect_level: deal?.prospect_level ?? '',
      agency_type: deal?.agency_type ?? '',
      memo: deal?.memo ?? '',
      custom_data: {
        ...(deal?.custom_data ?? {}),
        age: normalizeAgeValue(deal?.custom_data?.age ?? deal?.age) || undefined,
        email: deal?.email ?? deal?.custom_data?.email ?? undefined,
        phone: deal?.phone ?? deal?.custom_data?.phone ?? undefined,
      },
    });

  const getCurrentCustomerSnapshot = () =>
    stableStringify({
      customer_name: editCustomerName.trim(),
      assigned_to: getLiveEditValues().assigned_to,
      deal_date: getLiveEditValues().deal_date,
      retirement_date: editRetirementDate || '',
      source: normalizeSourceValue(getLiveEditValues().source),
      age: normalizeAgeValue(editCustomData?.age) || '',
      agency_code: getLiveEditValues().referrer || '',
      result_status: editResultStatus || '',
      email: getLiveEditValues().email.trim(),
      phone: editPhone.trim(),
      prospect_level: editProspectLevel || '',
      agency_type: editAgencyType || '',
      memo: editMemo || '',
      custom_data: {
        ...(editCustomData ?? {}),
        age: normalizeAgeValue(editCustomData?.age) || undefined,
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
      },
    });

  const currentCustomerSnapshot = getCurrentCustomerSnapshot();
  const persistedCustomerSnapshot = deal ? getPersistedCustomerSnapshot() : '';
  const hasUnsavedCustomerChanges =
    isCustomerFormReady && !!deal && currentCustomerSnapshot !== persistedCustomerSnapshot;

  const selectedInterviewStatus = interviewStatusOptions.find((s) => s.code === interviewStatus);
  const selectedResultStatus = resultStatusOptions.find((s) => s.code === resultStatus);
  const canRecordResult = new Set(['ST_MEETING', 'INTERVIEWED', 'CONSIDERING', 'RS_PEND', 'RS_IN_PROG', 'RS_REDEAL']).has(String(dealStatus));
  const isFollowUpResultStatus = new Set(['CONSIDERING', 'RS_PEND', 'RS_IN_PROG', 'RS_REDEAL']).has(String(dealStatus));

  useEffect(() => {
    if (!deal) return;
    if (customerFormHydratedDealIdRef.current === deal.id) return;
    customerFormHydratedDealIdRef.current = deal.id;

    const resolvedAge = normalizeAgeValue(deal.custom_data?.age ?? deal.age);
    setEditCustomerName(deal.customer_name ?? '');
    setEditAssignedTo(deal.assigned_to ?? '');
    setEditDealDate(deal.deal_date ?? '');
    setEditRetirementDate(deal.retirement_date ?? '');
    setEditSourceCode(normalizeSourceValue(deal.source));
    setEditAgencyCode(deal.agency_code ?? '');
    setEditResultStatus(deal.result_status ?? '');
    setEditEmail(deal.email ?? deal.custom_data?.email ?? '');
    setEditPhone(deal.phone ?? deal.custom_data?.phone ?? '');
    setEditProspectLevel(deal.prospect_level ?? '');
    setEditAgencyType(deal.agency_type ?? '');
    setEditMemo(deal.memo ?? '');
    setEditCustomData({
      ...(deal.custom_data ?? {}),
      ...(resolvedAge ? { age: resolvedAge } : {}),
    } as Record<string, any>);
    lastSavedCustomerSnapshotRef.current = getPersistedCustomerSnapshot();
    setIsCustomerFormReady(true);
  }, [deal]);

  useEffect(() => {
    isCustomerFormReadyRef.current = isCustomerFormReady;
  }, [isCustomerFormReady]);

  useEffect(() => {
    dealRef.current = deal;
  }, [deal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/custom-fields', { cache: 'no-store' }).catch(() => null);
      if (!res || cancelled) return;
      const json = (await res.json().catch(() => null)) as { data?: DealCustomFieldDefinition[] } | null;
      if (cancelled) return;
      setCustomFieldDefs((json?.data ?? []).filter((d) => d.is_active !== false));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentDealProgressValidation.isValid && transitionError) {
      setTransitionError('');
    }
  }, [currentDealProgressValidation.isValid, transitionError]);

  const persistCustomerChanges = async (options: { silent?: boolean } = {}) => {
    if (!deal) return false;

    const snapshotBeforeSave = currentCustomerSnapshot;
    if (snapshotBeforeSave === lastSavedCustomerSnapshotRef.current) {
      return true;
    }
    if (customerSavePromiseRef.current) {
      return customerSavePromiseRef.current;
    }

    if (!options.silent) {
      setCustomerSaveError('');
    }

    setIsCustomerSaving(true);
    try {
      validateCustomDataOrThrow(customFieldDefs, editCustomData ?? {});
    } catch (e) {
      if (!options.silent) {
        setCustomerSaveError(e instanceof Error ? e.message : 'カスタム項目の入力が不正です');
      }
      setIsCustomerSaving(false);
      return false;
    }

    const savePromise = (async () => {
      const payload = getCustomerSavePayload();
      try {
        const updated = await updateDealById(deal.id, payload);
        if (!updated) {
          throw new Error('保存後のデータを取得できませんでした');
        }

        lastSavedCustomerSnapshotRef.current = snapshotBeforeSave;
        setDeal((prev) => (prev ? { ...prev, ...updated } : prev));
        setInterviewError('');
        if (!options.silent) {
          setCustomerSaveError('');
          setSuccessMessage('顧客詳細を保存しました');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2500);
        }
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : '保存に失敗しました';
        if (!options.silent) {
          console.error('Update error:', error);
          setCustomerSaveError(message);
        } else {
          console.error('Auto-save error:', error);
        }
        return false;
      }
    })();

    customerSavePromiseRef.current = savePromise;
    try {
      return await savePromise;
    } finally {
      if (customerSavePromiseRef.current === savePromise) {
        customerSavePromiseRef.current = null;
      }
      setIsCustomerSaving(false);
    }
  };

  persistCustomerChangesRef.current = persistCustomerChanges;

  useEffect(() => {
    if (!isCustomerFormReady || !deal) return;
    if (!hasUnsavedCustomerChanges) return;

    if (customerSaveTimerRef.current !== null) {
      window.clearTimeout(customerSaveTimerRef.current);
    }

    customerSaveTimerRef.current = window.setTimeout(() => {
      void persistCustomerChanges({ silent: true });
    }, 700);

    return () => {
      if (customerSaveTimerRef.current !== null) {
        window.clearTimeout(customerSaveTimerRef.current);
      }
    };
  }, [hasUnsavedCustomerChanges, isCustomerFormReady, deal, currentCustomerSnapshot]);

  useEffect(() => {
    return () => {
      if (customerSaveTimerRef.current !== null) {
        window.clearTimeout(customerSaveTimerRef.current);
      }
      if (isCustomerFormReadyRef.current && dealRef.current) {
        void persistCustomerChangesRef.current?.({ silent: true });
      }
    };
  }, []);

  const handleBackToDeals = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!(await persistCustomerChanges())) return;
    router.push('/deals');
  };

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
        <Link href="/deals" onClick={handleBackToDeals} className="text-blue-600 hover:text-blue-700">商談一覧へ戻る</Link>
      </div>
    );
  }

  // ── 面談記録を保存（NEW → INTERVIEWED or NEW のまま）
  const handleSaveInterview = async () => {
    if (!(await persistCustomerChanges())) {
      return;
    }
    if (!editDealProgressValidation.isValid) {
      setInterviewError(editDealProgressError);
      return;
    }
    const statusValue = interviewStatusRef.current?.value || interviewStatus;
    if (!statusValue) {
      setInterviewError('面談ステータスを選択してください');
      return;
    }
    const newStatus = statusValue as DealStatus;
    const payload = {
      interview_status: selectedInterviewStatus?.name ?? statusValue,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    try {
      const updated = await updateDealById(deal.id, payload);
      if (!updated) {
        throw new Error('保存後のデータを取得できませんでした');
      }
      setDeal((prev) => (prev ? { ...prev, ...updated } : prev));
      setDealStatus(newStatus);
      setInterviewError('');
      setSuccessMessage(`面談記録「${selectedInterviewStatus?.name ?? statusValue}」を保存しました`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      setTimeout(() => {
        document.getElementById('result-entry-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      setInterviewError(error instanceof Error ? error.message : '保存に失敗しました');
    }
  };

  // ── 結果を保存（INTERVIEWED / CONSIDERING → 成約/検討/対象外/失注）
  const handleSaveResult = async () => {
    if (!(await persistCustomerChanges())) {
      return;
    }
    if (!editDealProgressValidation.isValid) {
      setResultError(editDealProgressError);
      return;
    }
    const statusValue = resultStatusRef.current?.value || resultStatus;
    if (!statusValue) {
      setResultError('結果ステータスを選択してください');
      return;
    }
    const mappedStatus = statusValue as DealStatus;
    const payload: Record<string, unknown> = {
      result_status: selectedResultStatus?.name ?? statusValue,
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
    if (statusValue === 'RS_PEND' || statusValue === 'CONSIDERING') {
      payload.considering_reason = consideringReason || null;
      payload.considering_reason_comment = consideringComment || null;
    }
    if (statusValue === 'RS_OUT_SCOPE' || statusValue === 'OUT_OF_SCOPE') {
      payload.out_of_scope_reason = outOfScopeReason || null;
      payload.out_of_scope_reason_comment = outOfScopeComment || null;
    }
    if (statusValue === 'RS_LOST' || statusValue === 'LOST') {
      payload.lost_reason = lostReason || null;
      payload.lost_reason_comment = lostComment || null;
    }
    try {
      const updated = await updateDealById(deal.id, payload);
      if (!updated) {
        throw new Error('保存後のデータを取得できませんでした');
      }
      setDeal((prev) => (prev ? { ...prev, ...updated } : prev));
      setDealStatus(mappedStatus);
      setResultError('');
      setSuccessMessage(`結果「${selectedResultStatus?.name ?? statusValue}」を保存しました`);
      setShowSuccess(true);

      if (statusValue === 'RS_CONTRACT' || statusValue === 'CONTRACTED') {
        setTimeout(() => router.push(`/deals/${deal.id}/contract-detail`), 1200);
      } else {
        setTimeout(() => setShowSuccess(false), 2500);
      }
    } catch (error) {
      setResultError(error instanceof Error ? error.message : '保存に失敗しました');
    }
  };

  // ── 顧客詳細を保存
  const handleSaveCustomer = async () => {
    await persistCustomerChanges();
  };

  // ── 編集キャンセル（元の値に戻す）
  const handleCancelEdit = () => {
    const resolvedAge = normalizeAgeValue(deal.custom_data?.age ?? deal.age);
    setEditCustomerName(deal.customer_name);
    setEditAssignedTo(deal.assigned_to);
    setEditDealDate(deal.deal_date);
    setEditRetirementDate(deal.retirement_date);
    setEditSourceCode(normalizeSourceValue(deal.source));
    setEditAgencyCode(deal.agency_code ?? '');
    setEditResultStatus(deal.result_status ?? '');
    setEditEmail(deal.email ?? deal.custom_data?.email ?? '');
    setEditPhone(deal.phone ?? deal.custom_data?.phone ?? '');
    setEditProspectLevel(deal.prospect_level ?? '');
    setEditAgencyType(deal.agency_type ?? '');
    setEditMemo(deal.memo ?? '');
    setEditCustomData({
      ...(deal.custom_data ?? {}),
      ...(resolvedAge ? { age: resolvedAge } : {}),
    } as Record<string, any>);
  };

  const handleDeleteDeal = () => {
    if (!deal?.id) return;
    const ok = window.confirm(`商談 ${deal.id} を削除します。元に戻せません。`);
    if (!ok) return;
    (async () => {
      const res = await fetch(`/api/deals/${encodeURIComponent(deal.id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInterviewError(`削除に失敗しました: ${json?.error ?? res.statusText}`);
        return;
      }
      router.push('/deals');
    })();
  };

  const selectClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const selectErrorClass = 'w-full px-3 py-2 border border-red-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400';
  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const isContractedOrLater = isClosingStatus(dealStatus);
  const isDetailEnteredOrLater = ['DETAIL_ENTERED', 'APPROVED', 'CONTRACT_SIGNED', 'PAYMENT_MANAGING', 'COMPLETED'].includes(dealStatus);

  const guardDealProgressTransition = async () => {
    if (!(await persistCustomerChanges())) {
      return false;
    }
    const validation = editDealProgressValidation;
    if (!validation.isValid) {
      setTransitionError(getDealProgressValidationMessage(validation));
      return false;
    }
    setTransitionError('');
    return true;
  };

  const handleProceedToContractDetail = async () => {
    if (!(await guardDealProgressTransition())) return;
    router.push(`/deals/${deal.id}/contract-detail`);
  };

  const handleProceedToApproval = async () => {
    if (!(await guardDealProgressTransition())) return;
    router.push(`/deals/${deal.id}/approval`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">商談詳細</h1>
          <p className="text-xs text-gray-400 mt-1">{deal.id}</p>
        </div>
        <Link href="/deals" onClick={handleBackToDeals} className="text-sm text-blue-600 hover:text-blue-700">← 商談一覧</Link>
      </div>

      {showSuccess && (
        <div
          className="fixed bottom-6 right-6 z-50 pointer-events-none"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg shadow-green-100">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-900">保存しました</p>
              <p className="mt-0.5 text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {!currentDealProgressValidation.isValid && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium">次の処理に進む前に、必須項目をすべて入力してください。</p>
          {currentDealProgressValidation.missingFields.length > 0 && (
            <p className="text-amber-700 text-sm mt-1">
              不足項目: {currentDealProgressValidation.missingFields.map(getDealProgressFieldLabel).join('、')}
            </p>
          )}
          {currentDealProgressValidation.missingFields.length === 0 && (
            <p className="text-amber-700 text-sm mt-1">{currentDealProgressError}</p>
          )}
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
          </div>
        </div>

        {isEditing ? (
          /* ── 編集モード ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">担当者 <span className="text-red-500">*</span></label>
                <select ref={editAssignedToRef} value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} className={inputClass}>
                  <option value="">-- 未選択 --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">結果ステータス</label>
                <select value={editResultStatus} onChange={(e) => setEditResultStatus(e.target.value)} className={inputClass}>
                  <option value="">-- 未選択 --</option>
                  {resultStatusOptions.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">商談日 <span className="text-red-500">*</span></label>
                <input ref={editDealDateRef} type="date" value={editDealDate} onChange={(e) => setEditDealDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">退職予定日</label>
                <input type="date" value={editRetirementDate} onChange={(e) => setEditRetirementDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">年齢 <span className="text-red-500">*</span></label>
                <input
                  ref={editAgeRef}
                  type="text"
                  inputMode="numeric"
                  value={String(editCustomData?.age ?? '')}
                  onChange={(e) => setEditCustomData((prev) => ({ ...prev, age: e.target.value }))}
                  onBlur={() => {
                    void persistCustomerChanges({ silent: true });
                  }}
                  className={inputClass}
                  placeholder="例：60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">メールアドレス <span className="text-red-500">*</span></label>
                <input
                  ref={editEmailRef}
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={inputClass}
                  placeholder="example@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">電話番号</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={inputClass}
                  placeholder="090-xxxx-xxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">見込み顧客</label>
                <select value={editProspectLevel} onChange={(e) => setEditProspectLevel(e.target.value)} className={inputClass}>
                  <option value="">-- 未選択 --</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">流入経路 <span className="text-red-500">*</span></label>
                <select ref={editSourceCodeRef} value={normalizeSourceValue(editSourceCode)} onChange={(e) => setEditSourceCode(e.target.value)} className={inputClass}>
                  <option value="">-- 未選択 --</option>
                  {sources.filter((s) => !NO_SOURCE_LABELS.has(s.name.trim())).map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">紹介者（代理店経由）</label>
                <AgencySearchSelect
                  value={editAgencyCode}
                  onChange={(code) => setEditAgencyCode(code)}
                  agencies={agencies}
                  placeholder="-- なし --"
                />
              </div>
              <p className="text-xs text-gray-500 sm:col-span-2 -mt-2">
                流入経路または紹介者のどちらか一方を入力してください。
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">代理店新旧</label>
                <select value={editAgencyType} onChange={(e) => setEditAgencyType(e.target.value)} className={inputClass}>
                  <option value="">-- 未選択 --</option>
                  <option value="新規">新規</option>
                  <option value="既存">既存</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">メモ</label>
              <textarea value={editMemo} onChange={(e) => setEditMemo(e.target.value)} rows={3} placeholder="備考・メモ" className={inputClass} />
            </div>
            {customFieldDefs.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-500 mb-2">カスタム項目</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customFieldDefs
                    .slice()
                    .sort((a, b) => (a.order_index - b.order_index) || (a.id - b.id))
                    .map((def) => {
                      const value = editCustomData?.[def.key_name];
                      const options = Array.isArray(def.options_json) ? (def.options_json as any[]).map(String) : [];

                      if (def.field_type === 'select') {
                        return (
                          <div key={def.id}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              {def.name}{def.required ? ' *' : ''}
                            </label>
                            <select
                              value={typeof value === 'string' ? value : String(value ?? '')}
                              onChange={(e) =>
                                setEditCustomData((p) => ({ ...(p ?? {}), [def.key_name]: e.target.value || null }))
                              }
                              className={inputClass}
                            >
                              <option value="">-- 未選択 --</option>
                              {options.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      if (def.field_type === 'checkbox') {
                        const selected = Array.isArray(value) ? value.map(String) : [];
                        return (
                          <div key={def.id}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              {def.name}{def.required ? ' *' : ''}
                            </label>
                            <div className="flex flex-wrap gap-3 pt-2">
                              {options.map((o) => (
                                <label key={o} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(o)}
                                    onChange={(e) => {
                                      setEditCustomData((p) => {
                                        const prev = (p ?? {}) as Record<string, any>;
                                        const next = new Set(Array.isArray(prev[def.key_name]) ? prev[def.key_name].map(String) : []);
                                        if (e.target.checked) next.add(o);
                                        else next.delete(o);
                                        return { ...prev, [def.key_name]: Array.from(next) };
                                      });
                                    }}
                                  />
                                  {o}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={def.id}>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            {def.name}{def.required ? ' *' : ''}
                          </label>
                          <input
                            type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
                            value={value === null || value === undefined ? '' : String(value)}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEditCustomData((p) => ({ ...(p ?? {}), [def.key_name]: v === '' ? null : v }));
                            }}
                            className={inputClass}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveCustomer}
                disabled={isCustomerSaving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
              >
                {isCustomerSaving ? '保存中...' : '保存する'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition"
              >
                変更を取り消す
              </button>
              <button
                type="button"
                onClick={handleDeleteDeal}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition ml-auto"
              >
                この商談を削除
              </button>
            </div>
            {customerSaveError && (
              <p className="text-sm text-red-600">{customerSaveError}</p>
            )}
          </div>
        ) : (
          /* ── 表示モード ── */
          <dl className="divide-y divide-gray-100">
            {[
              ['お客様氏名', deal.customer_name ?? '-'],
              ['担当 *', users.find((u) => u.id === deal.assigned_to)?.name ?? deal.assigned_to ?? '-'],
              ['結果ステータス', deal.result_status ?? '-'],
              ['商談日 *', deal.deal_date ? formatDate(deal.deal_date) : '-'],
              ['年齢 *', normalizeAgeValue(deal.custom_data?.age ?? deal.age) || '-'],
              ['メールアドレス *', deal.email ?? deal.custom_data?.email ?? '-'],
              ['電話番号', deal.phone ?? deal.custom_data?.phone ?? '-'],
              ['見込み顧客', deal.prospect_level ?? '-'],
              ['流入経路（エルステ経由） *', sources.find((s) => s.code === normalizeSourceValue(deal.source))?.name ?? normalizeSourceValue(deal.source) ?? '-'],
              ['紹介者（代理店経由）', agencies.find((a) => a.code === deal.agency_code)?.name ?? deal.agency_code ?? '-'],
              ['退職予定日', deal.retirement_date ? formatDate(deal.retirement_date) : '-'],
              ['代理店新旧', deal.agency_type ?? '-'],
              ['メモ', deal.memo || '-'],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-3">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="sm:col-span-2 text-sm text-gray-900">{value}</dd>
              </div>
            ))}

            {customFieldDefs.length > 0 && (
              <div className="py-3">
                <dt className="text-sm font-medium text-gray-500 mb-2">カスタム項目</dt>
                <div className="space-y-2">
                  {customFieldDefs
                    .slice()
                    .sort((a, b) => (a.order_index - b.order_index) || (a.id - b.id))
                    .map((def) => {
                      const v = (deal.custom_data ?? {})[def.key_name];
                      const display = Array.isArray(v) ? v.join(', ') : (v ?? '-');
                      return (
                        <div key={def.id} className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                          <div className="text-sm text-gray-500">{def.name}</div>
                          <div className="sm:col-span-2 text-sm text-gray-900">{String(display)}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

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
        {isContractedOrLater && (
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleProceedToContractDetail}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              成約詳細を入力
            </button>
            {isDetailEnteredOrLater && (
              <button
                type="button"
                onClick={handleProceedToApproval}
                className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                事務承認
              </button>
            )}
          </div>
        )}
        {transitionError && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-900">次の段階へ進めません</p>
            <p className="text-sm text-amber-800 mt-1">{transitionError}</p>
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
                ref={interviewStatusRef}
                value={interviewStatus}
                onChange={(e) => { setInterviewStatus(e.target.value); setInterviewError(''); }}
                className={interviewError ? selectErrorClass : selectClass}
              >
                <option value="">-- 選択してください --</option>
                {interviewStatusOptions.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
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
      {canRecordResult && (
        <div id="result-entry-section" className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <h2 className="text-base font-bold text-gray-900 mb-1">
            {isFollowUpResultStatus ? 'ステータスを変更する' : '面談結果を入力する'}
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            {isFollowUpResultStatus
              ? '成約・対象外・失注・検討・商談中・再商談のいずれかに変更できます。'
              : '成約・検討・商談中・再商談・対象外・失注のいずれかを選択してください。'}
          </p>

          <div className="space-y-5">
            {/* 結果ステータス */}
            <div className="max-w-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                結果 <span className="text-red-500">*</span>
              </label>
              <select
                ref={resultStatusRef}
                value={resultStatus}
                onChange={(e) => { setResultStatus(e.target.value); setResultError(''); }}
                className={resultError ? selectErrorClass : selectClass}
              >
                <option value="">-- 選択してください --</option>
                {(isFollowUpResultStatus
                  ? resultStatusOptions.filter((s) => s.code !== 'RS_PEND')
                  : resultStatusOptions
                ).map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
              {resultError && <p className="text-red-500 text-xs mt-1">{resultError}</p>}
            </div>

            {/* 検討理由 */}
            {(resultStatus === 'RS_PEND' || resultStatus === 'CONSIDERING') && (
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
            {(resultStatus === 'RS_OUT_SCOPE' || resultStatus === 'OUT_OF_SCOPE') && (
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
            {(resultStatus === 'RS_LOST' || resultStatus === 'LOST') && (
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
              {resultStatus === 'RS_CONTRACT' || resultStatus === 'CONTRACTED' ? '保存して成約詳細へ →' : '結果を保存する'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
