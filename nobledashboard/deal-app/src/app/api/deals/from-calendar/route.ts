import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  formatEventForDeal,
  isSpecialCalendarEvent,
  parseLStepCalendarDescription,
  type ICalEvent,
} from '@/lib/ical';
import { validateCalendarDealInput } from '@/lib/calendar-deal-validation';
import { nullIfEmpty, stripCustomDataColumn, writeDealWithCustomDataFallback } from '@/lib/deal-write';

function buildDealId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `D-${datePart}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await readAppSessionCookie();
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => null)) as {
      event?: Partial<ICalEvent>;
      retirement_date?: string;
      customer_name?: string;
      assigned_to?: string;
      deal_date?: string;
      source?: string;
      agency_code?: string;
      auto_register?: boolean;
      custom_data?: Record<string, unknown> & {
        age?: string | number;
        email?: string;
        phone?: string;
      };
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
    const isSpecialEvent = isSpecialCalendarEvent(event.summary);

    const supabase = createSupabaseAdminClient();

    const { data: sourceRows, error: sourceError } = await supabase
      .from('m_sources')
      .select('code, name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (sourceError) {
      console.error('[deals/from-calendar] source fetch error:', sourceError);
      return NextResponse.json({ error: 'source_fetch_failed', message: sourceError.message }, { status: 500 });
    }

    const { data: agencyRows, error: agencyError } = await supabase
      .from('m_agencies')
      .select('code')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (agencyError) {
      console.error('[deals/from-calendar] agency fetch error:', agencyError);
      return NextResponse.json({ error: 'agency_fetch_failed', message: agencyError.message }, { status: 500 });
    }

    const sourceCodes = (sourceRows ?? []).map((r) => r.code);
    const agencyCodes = (agencyRows ?? []).map((r) => r.code);
    const fallbackSourceCode =
      sourceRows?.find((row) => row.name === '流入経路なし' || row.name === '不明')?.code ??
      sourceRows?.[0]?.code ??
      null;
    const autoRegister = body?.auto_register === true || isSpecialEvent;

    const sourceValue =
      typeof body.source === 'string' && body.source.trim()
        ? body.source.trim()
        : autoRegister
          ? fallbackSourceCode ?? draft.source
          : '';
    const referrerValue = typeof body.agency_code === 'string' ? body.agency_code : '';
    const retirementDateValue =
      typeof body.retirement_date === 'string' && body.retirement_date.trim()
        ? body.retirement_date.trim()
        : parsed.retirementDate || '';
    const customerNameValue =
      typeof body.customer_name === 'string' && body.customer_name.trim()
        ? body.customer_name.trim()
        : parsed.customerName || draft.customer_name;
    const dealDateValue =
      typeof body.deal_date === 'string' && body.deal_date.trim()
        ? body.deal_date.trim()
        : draft.deal_date;
    const ageValue =
      typeof body.custom_data?.age === 'string' || typeof body.custom_data?.age === 'number'
        ? String(body.custom_data.age)
        : parsed.age || '';
    const emailValue =
      typeof body.custom_data?.email === 'string'
        ? body.custom_data.email
        : parsed.email || '';
    const phoneValue =
      typeof body.custom_data?.phone === 'string'
        ? body.custom_data.phone
        : parsed.phone || '';

    const validation = validateCalendarDealInput(
      {
        customer_name: customerNameValue,
        assigned_to: typeof body.assigned_to === 'string' && body.assigned_to.trim() ? body.assigned_to.trim() : session.userId,
        retirement_date: retirementDateValue,
        deal_date: dealDateValue,
        age: ageValue,
        email: emailValue,
        source: sourceValue,
        referrer: referrerValue,
        phone: phoneValue,
      },
      {
        sourceCodes,
        agencyCodes,
      }
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'validation_failed',
          message: '入力内容を確認してください',
          field_errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const sourceCode = validation.normalized.source || null;
    const agencyCode = validation.normalized.referrer || null;
    const retirementDate = validation.normalized.retirement_date;
    const customerName = validation.normalized.customer_name;
    const dealDate = validation.normalized.deal_date;
    const email = validation.normalized.email || undefined;
    const phone = validation.normalized.phone || undefined;

    // 退職前サポートの自動登録は、後から編集できる項目（年齢・メールアドレス）を
    // 厳密な必須条件にしない。ここで弾くと、タイトル表示だけで来るイベントが
    // 自動登録できずに失敗扱いになってしまう。
    const blockingErrors = Object.fromEntries(
      Object.entries(validation.errors).filter(([field]) => {
        if (!autoRegister) return true;
        return field !== 'age' && field !== 'email';
      })
    );

    if (Object.keys(blockingErrors).length > 0) {
      return NextResponse.json(
        {
          error: 'validation_failed',
          message: '入力内容を確認してください',
          field_errors: blockingErrors,
        },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'already_registered', message: '既に商談化済みです', deal_id: existing.id },
        { status: 409 }
      );
    }

    const dealId = buildDealId();
    const payload = {
      id: dealId,
      customer_name: customerName,
      assigned_to: session.userId,
      deal_date: dealDate,
      deal_notes: draft.deal_notes,
      source: sourceCode,
      age: validation.normalized.age || null,
      agency_code: agencyCode,
      status: 'NEW',
      retirement_date: nullIfEmpty(retirementDate),
      calendar_event_id: draft.calendar_event_id,
      email,
      custom_data: {
        ...(body?.custom_data ?? {}),
        age: validation.normalized.age ? Number(String(validation.normalized.age).replace(/[^\d]/g, '')) || validation.normalized.age : undefined,
        email: validation.normalized.email || undefined,
        phone: validation.normalized.phone || undefined,
      },
      phone,
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

    const { error } = await writeDealWithCustomDataFallback(
      'deals/from-calendar insert',
      async () => await supabase.from('deals').insert(payload),
      async () => await supabase.from('deals').insert(stripCustomDataColumn(payload))
    );
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
