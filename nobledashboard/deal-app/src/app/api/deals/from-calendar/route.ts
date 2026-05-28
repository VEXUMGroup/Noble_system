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
  try {
    const session = readAppSessionCookie();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => null)) as {
      event?: Partial<ICalEvent>;
      retirement_date?: string;
      customer_name?: string;
      deal_date?: string;
      source?: string;
      agency_code?: string;
      custom_data?: Record<string, unknown>;
    } | null;

    if (!body?.event?.id || !body.event.start) {
      return NextResponse.json({ error: 'invalid_request', message: 'イベント情報が不足しています' }, { status: 400 });
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

    if (Number.isNaN(event.start.getTime())) {
      return NextResponse.json({ error: 'invalid_event_start', message: '開始日時の形式が不正です' }, { status: 400 });
    }
    if (Number.isNaN(event.end.getTime())) {
      return NextResponse.json({ error: 'invalid_event_end', message: '終了日時の形式が不正です' }, { status: 400 });
    }

    const draft = formatEventForDeal(event);
    const parsed = parseLStepCalendarDescription(event.description);
    const retirementDate = body.retirement_date || parsed.retirementDate;
    if (!retirementDate) {
      return NextResponse.json({ error: 'retirement_date_required', message: '退職予定日が必要です' }, { status: 400 });
    }

    const requestedCustomerName = typeof body.customer_name === 'string' ? body.customer_name.trim() : '';
    const customerName = requestedCustomerName || draft.customer_name;
    if (!customerName) {
      return NextResponse.json({ error: 'customer_name_required', message: '顧客名が必要です' }, { status: 400 });
    }

    const requestedDealDate = typeof body.deal_date === 'string' ? body.deal_date.trim() : '';
    const dealDate = requestedDealDate || draft.deal_date;
    if (!dealDate) {
      return NextResponse.json({ error: 'deal_date_required', message: '商談日が必要です' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data: sourceRows, error: sourceError } = await supabase
      .from('m_sources')
      .select('code')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (sourceError) {
      console.error('[deals/from-calendar] source fetch error:', sourceError);
      return NextResponse.json({ error: 'source_fetch_failed', message: sourceError.message }, { status: 500 });
    }

    const sourceCodes = (sourceRows ?? []).map((r) => r.code);
    const requestSource = typeof body.source === 'string' ? body.source.trim() : '';
    const sourceCode = requestSource && sourceCodes.includes(requestSource) ? requestSource : null;

    const { data: existing, error: existingError } = await supabase
      .from('deals')
      .select('id')
      .eq('calendar_event_id', draft.calendar_event_id)
      .maybeSingle();
    if (existingError) {
      console.error('[deals/from-calendar] existing check error:', existingError);
      return NextResponse.json({ error: 'existing_check_failed', message: existingError.message }, { status: 500 });
    }

    if (existing?.id) {
      return NextResponse.json({ error: 'already_registered', message: '既に商談化済みです' }, { status: 409 });
    }

    const dealId = buildDealId();
    const payload = {
      id: dealId,
      customer_name: customerName,
      assigned_to: session.userId,
      deal_date: dealDate,
      deal_notes: draft.deal_notes,
      source: sourceCode,
      agency_code: typeof body?.agency_code === 'string' ? body.agency_code.trim() || null : null,
      status: 'NEW',
      retirement_date: retirementDate,
      calendar_event_id: draft.calendar_event_id,
      custom_data: body?.custom_data ?? {},
      created_by: session.userId,
      updated_by: session.userId,
    };

    // Debug mode: if the request includes a `debug` flag, return the generated notes without inserting
    const debugFlag = (body as any)?.debug === true;
    if (debugFlag) {
      return NextResponse.json({
        ok: true,
        debug: true,
        deal_notes: draft.deal_notes,
        payload,
      });
    }

    const { error } = await supabase.from('deals').insert(payload);
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'already_registered', message: '既に商談化済みです' }, { status: 409 });
      }
      console.error('[deals/from-calendar] insert error:', error);
      return NextResponse.json({ error: 'insert_failed', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deal_id: dealId });
  } catch (err) {
    console.error('[deals/from-calendar] unhandled:', err);
    const message = err instanceof Error ? err.message : 'internal_error';
    return NextResponse.json({ error: 'internal_error', message }, { status: 500 });
  }
}
