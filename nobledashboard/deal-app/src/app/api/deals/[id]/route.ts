import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import {
  sendApprovalRejectedNotifications,
  sendDealContractedNotifications,
  shouldNotifyApprovalRejected,
  shouldNotifyDealContracted,
  type DealNotificationSnapshot,
} from '@/lib/deal-status-notifications';
import { writeDealWithMissingColumnFallback } from '@/lib/deal-write';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dealId = params.id;
  if (!dealId) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('deals').delete().eq('id', dealId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

const UPDATEABLE_FIELDS = new Set([
  'customer_name',
  'assigned_to',
  'deal_date',
  'retirement_date',
  'source',
  'agency_code',
  'result_status',
  'email',
  'phone',
  'age',
  'prospect_level',
  'media',
  'campaign_id',
  'agency_type',
  'memo',
  'custom_data',
  'interview_status',
  'status',
  'hr_proposal',
  'hr_feasibility',
  'hr_target_28m',
  'next_action_date',
  'considering_reason',
  'considering_reason_comment',
  'out_of_scope_reason',
  'out_of_scope_reason_comment',
  'lost_reason',
  'lost_reason_comment',
  'contract_plan',
  'contract_plan_other',
  'amount',
  'payment_plan',
  'payment_method',
  'payment_deadline',
  'contract_confirmation',
  'contract_date',
  'irregular_notes',
  'address',
  'proposal_content',
  'remarks',
  'recording_url',
  'updated_at',
]);

const NULLABLE_DATE_FIELDS = new Set(['retirement_date', 'next_action_date', 'payment_deadline', 'contract_date']);

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, message, details } = error as { code?: string; message?: string; details?: string };
  const haystack = `${code ?? ''} ${message ?? ''} ${details ?? ''}`.toLowerCase();
  return code === '42703' || code === 'PGRST204' || haystack.includes('could not find') || haystack.includes('does not exist');
}

async function hasDealColumn(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  column: 'age' | 'custom_data'
) {
  const { error } = await supabase.from('deals').select(column).limit(1);
  if (!error) return true;
  if (isMissingColumnError(error)) return false;
  throw error;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dealId = params.id;
  if (!dealId) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const body = (await request.json().catch(() => null)) as
    | { patch?: Record<string, unknown> }
    | Record<string, unknown>
    | null;

  const rawPatch = (body && 'patch' in body ? body.patch : body) ?? {};
  if (!rawPatch || typeof rawPatch !== 'object' || Array.isArray(rawPatch)) {
    return NextResponse.json({ error: 'invalid_patch' }, { status: 400 });
  }

  const patch = Object.fromEntries(
    Object.entries(rawPatch).filter(([key]) => UPDATEABLE_FIELDS.has(key))
  ) as Record<string, unknown>;

  const hasCustomData = 'custom_data' in patch && patch.custom_data && typeof patch.custom_data === 'object' && !Array.isArray(patch.custom_data);
  const customData = hasCustomData ? ({ ...(patch.custom_data as Record<string, unknown>) }) : undefined;

  if (customData && !('age' in patch) && 'age' in customData) {
    patch.age = customData.age;
  }

  if ('age' in patch && typeof patch.age === 'string' && patch.age.trim() === '') {
    patch.age = null;
  }

  const normalizedAge =
    typeof patch.age === 'string' && patch.age.trim().length > 0
      ? patch.age.trim()
      : typeof patch.age === 'number' && Number.isFinite(patch.age)
      ? String(patch.age)
      : null;

  if (normalizedAge !== null) {
    patch.age = normalizedAge;
  }

  if (customData) {
    if (normalizedAge !== null) {
      customData.age = normalizedAge;
    } else {
      delete customData.age;
    }
    patch.custom_data = customData;
  } else if ('age' in patch) {
    patch.custom_data = normalizedAge !== null ? { age: normalizedAge } : {};
  }

  for (const key of Array.from(NULLABLE_DATE_FIELDS)) {
    if (key in patch && typeof patch[key] === 'string' && String(patch[key]).trim() === '') {
      patch[key] = null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'empty_patch', message: '更新内容がありません' }, { status: 400 });
  }

  patch.updated_at = new Date().toISOString();
  patch.updated_by = session.userId;

  const supabase = createSupabaseAdminClient();
  const { data: previousDealRow, error: previousDealError } = await supabase
    .from('deals')
    .select('id, customer_name, assigned_to, status, result_status, interview_status')
    .eq('id', dealId)
    .single();

  if (previousDealError) {
    return NextResponse.json(
      { error: 'deal_fetch_failed', message: previousDealError.message },
      { status: 500 }
    );
  }

  const requiresAgePersistence = 'age' in patch || (customData && 'age' in customData);
  if (requiresAgePersistence) {
    try {
      const [hasAgeColumn, hasCustomDataColumn] = await Promise.all([
        hasDealColumn(supabase, 'age'),
        hasDealColumn(supabase, 'custom_data'),
      ]);

      if (!hasAgeColumn && !hasCustomDataColumn) {
        return NextResponse.json(
          {
            error: 'schema_migration_required',
            message:
              '年齢の保存先がDBにありません。supabase/migrations/20260709_ensure_deal_age_storage.sql を適用してください。',
          },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: 'schema_check_failed',
          message: error instanceof Error ? error.message : '年齢保存先の確認に失敗しました',
        },
        { status: 500 }
      );
    }
  }

  const { data, error } = await writeDealWithMissingColumnFallback(
    'api/deals/[id] PATCH',
    patch,
    async (writePatch) =>
      await supabase
        .from('deals')
        .update(writePatch)
        .eq('id', dealId)
        .select('*')
        .single()
  );

  if (error) {
    return NextResponse.json(
      { error: 'update_failed', message: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'update_failed', message: '更新後の商談データを取得できませんでした' },
      { status: 500 }
    );
  }

  const previousDeal = previousDealRow as DealNotificationSnapshot;
  const nextDeal = data as DealNotificationSnapshot;
  const notificationTasks: Promise<unknown>[] = [];

  if (shouldNotifyDealContracted({ previousDeal, nextDeal, patch })) {
    notificationTasks.push(
      sendDealContractedNotifications({
        deal: nextDeal,
        eventKey: `deal_contracted:${dealId}:${String(patch.updated_at)}`,
      })
    );
  }

  if (shouldNotifyApprovalRejected({ previousDeal, nextDeal, patch })) {
    notificationTasks.push(
      sendApprovalRejectedNotifications({
        deal: nextDeal,
        comment: String(patch.memo ?? ''),
        eventKey: `approval_rejected:${dealId}:${String(patch.updated_at)}`,
      })
    );
  }

  if (notificationTasks.length > 0) {
    const results = await Promise.allSettled(notificationTasks);
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[api/deals/[id] PATCH] notification dispatch failed', result.reason);
      }
    }
  }

  return NextResponse.json({ ok: true, deal: data });
}
