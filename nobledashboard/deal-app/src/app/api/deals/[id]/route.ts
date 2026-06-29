import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { stripCustomDataColumn, writeDealWithCustomDataFallback } from '@/lib/deal-write';
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

  if ('custom_data' in patch && patch.custom_data && typeof patch.custom_data === 'object' && !Array.isArray(patch.custom_data)) {
    const customData = patch.custom_data as Record<string, unknown>;
    if (!('age' in patch) && 'age' in customData) {
      patch.age = customData.age;
    }
  }

  if ('age' in patch && typeof patch.age === 'string' && patch.age.trim() === '') {
    patch.age = null;
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
  const { data, error } = await writeDealWithCustomDataFallback(
    'api/deals/[id] PATCH',
    async () =>
      await supabase
        .from('deals')
        .update(patch)
        .eq('id', dealId)
        .select('*')
        .single(),
    async () =>
      await supabase
        .from('deals')
        .update(stripCustomDataColumn(patch))
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

  return NextResponse.json({ ok: true, deal: data });
}
