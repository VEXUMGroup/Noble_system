import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { formatEventForDeal, parseLStepCalendarDescription, type ICalEvent } from '@/lib/ical';

function buildDealId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `D-${datePart}-${rand}`;
}

export async function POST(request: NextRequest) {
  const session = readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    event?: Partial<ICalEvent>;
    retirement_date?: string;
  } | null;

  if (!body?.event?.id || !body.event.start) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const event: ICalEvent = {
    id: body.event.id,
    summary: body.event.summary ?? '（タイトルなし）',
    start: new Date(body.event.start),
    end: body.event.end ? new Date(body.event.end) : new Date(body.event.start),
    description: body.event.description,
    location: body.event.location,
    url: body.event.url,
  };

  const draft = formatEventForDeal(event);
  const parsed = parseLStepCalendarDescription(event.description);
  const retirementDate = body.retirement_date || parsed.retirementDate;
  if (!retirementDate) {
    return NextResponse.json({ error: 'retirement_date_required' }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  const { data: sourceRows } = await supabase
    .from('m_sources')
    .select('code')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  const sourceCodes = (sourceRows ?? []).map((r) => r.code);
  const sourceCode =
    sourceCodes.find((code) => code === 'LINE') ??
    sourceCodes.find((code) => code === 'WEB') ??
    sourceCodes[0] ??
    'LINE';

  const { data: existing } = await supabase
    .from('deals')
    .select('id')
    .eq('calendar_event_id', draft.calendar_event_id)
    .maybeSingle();

  if (existing?.id) {
    return NextResponse.json({ error: 'already_registered', message: '既に商談化済みです' }, { status: 409 });
  }

  const dealId = buildDealId();
  const payload = {
    id: dealId,
    customer_name: draft.customer_name,
    assigned_to: session.userId,
    deal_date: draft.deal_date,
    deal_notes: draft.deal_notes,
    source: sourceCode,
    status: 'NEW',
    retirement_date: retirementDate,
    calendar_event_id: draft.calendar_event_id,
    created_by: session.userId,
    updated_by: session.userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('deals').insert(payload);
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'already_registered', message: '既に商談化済みです' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deal_id: dealId });
}
