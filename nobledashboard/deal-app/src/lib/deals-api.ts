export type DealUpdatePayload = Record<string, unknown>;

const NULLABLE_DATE_FIELDS = new Set(['retirement_date', 'next_action_date', 'payment_deadline', 'contract_date']);

function normalizeDealUpdatePayload(patch: DealUpdatePayload): DealUpdatePayload {
  const normalized: DealUpdatePayload = { ...patch };
  for (const key of Array.from(NULLABLE_DATE_FIELDS)) {
    if (key in normalized) {
      const value = normalized[key];
      normalized[key] = typeof value === 'string' && value.trim().length === 0 ? null : value;
    }
  }
  return normalized;
}

export async function updateDealById(dealId: string, patch: DealUpdatePayload) {
  const normalizedPatch = normalizeDealUpdatePayload(patch);
  const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ patch: normalizedPatch }),
  });

  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; deal?: Record<string, unknown>; error?: string; message?: string }
    | null;

  if (!res.ok) {
    throw new Error(json?.message ?? json?.error ?? `保存に失敗しました (${res.status})`);
  }

  return (json?.deal ?? null) as Record<string, unknown> | null;
}
