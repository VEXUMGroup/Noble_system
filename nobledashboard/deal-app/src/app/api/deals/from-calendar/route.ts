import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  extractCalendarField,
  formatEventForDeal,
  isSpecialCalendarEvent,
  parseLStepCalendarDescription,
  type ICalEvent,
} from '@/lib/ical';
import { validateCalendarDealInput } from '@/lib/calendar-deal-validation';
import { extractMissingColumns, nullIfEmpty, writeDealWithMissingColumnFallback } from '@/lib/deal-write';

function buildDealId(eventId: string): string {
  const digest = createHash('sha256').update(eventId).digest('hex').slice(0, 16);
  return `D-${digest}`;
}

async function resolveAssignedToId(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  session: { userId: string; email: string }
): Promise<string | null> {
  const directUserId = session.userId?.trim();
  if (directUserId) {
    const { data } = await supabase.from('m_users').select('id').eq('id', directUserId).maybeSingle();
    if (data?.id) return data.id;
  }

  const normalizedEmail = session.email.trim();
  if (normalizedEmail) {
    const { data } = await supabase
      .from('m_users')
      .select('id')
      .ilike('email', normalizedEmail)
      .eq('is_active', true)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return directUserId || null;
}

function resolveSourceCodeForAutoRegister(
  bodySource: unknown,
  sourceCodes: string[],
  fallbackSourceCode: string | null
): string | null {
  if (typeof bodySource === 'string') {
    const trimmed = bodySource.trim();
    if (trimmed && sourceCodes.includes(trimmed)) {
      return trimmed;
    }
  }

  if (fallbackSourceCode) return fallbackSourceCode;

  if (sourceCodes.length > 0) return sourceCodes[0];

  return null;
}

type ExistingDealLookup = {
  calendarEventId: string;
  customerName: string;
  dealDate: string;
  dealNotes: string | null;
  assignedToId: string;
};

async function findExistingCalendarDeal(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  lookup: ExistingDealLookup
): Promise<{ id: string } | null> {
  const exactResult = await supabase
    .from('deals')
    .select('id')
    .eq('calendar_event_id', lookup.calendarEventId)
    .limit(1);

  if (exactResult.error) {
    console.warn('[deals/from-calendar] exact duplicate lookup failed; continuing without it', exactResult.error);
  } else if (exactResult.data?.[0]?.id) {
    return exactResult.data[0];
  }

  // 旧スキーマや一部未反映の環境では、`calendar_event_id` や `deal_notes` が
  // 存在しないことがある。その場合でも処理を止めず、利用できる列だけで
  // 既存判定を行う。
  const baseQuery = supabase
    .from('deals')
    .select('id')
    .eq('assigned_to', lookup.assignedToId)
    .eq('customer_name', lookup.customerName)
    .eq('deal_date', lookup.dealDate);

  const notesQuery = lookup.dealNotes
    ? baseQuery.eq('deal_notes', lookup.dealNotes)
    : baseQuery.is('deal_notes', null);
  const notesResult = await notesQuery.limit(1);
  if (!notesResult.error) {
    return notesResult.data?.[0] ?? null;
  }

  const missingColumns = extractMissingColumns(notesResult.error);
  if (missingColumns.some((column) => column === 'deal_notes')) {
    const fallbackResult = await baseQuery.limit(1);
    if (fallbackResult.error) {
      console.warn('[deals/from-calendar] fallback duplicate lookup failed; continuing without it', fallbackResult.error);
      return null;
    }
    return fallbackResult.data?.[0] ?? null;
  }

  if (missingColumns.includes('assigned_to') || missingColumns.includes('customer_name') || missingColumns.includes('deal_date')) {
    return null;
  }
  console.warn('[deals/from-calendar] notes duplicate lookup failed; continuing without it', notesResult.error);
  return null;
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
      source_codes?: string[];
      agency_code?: string;
      agency_codes?: string[];
      auto_register?: boolean;
      age?: string | number;
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
    const parsed = parseLStepCalendarDescription([event.summary, event.description].filter(Boolean).join('\n'));
    const isSpecialEvent = isSpecialCalendarEvent(event.summary);

    const supabase = createSupabaseAdminClient();

    const { data: sourceRows, error: sourceError } = await supabase
      .from('m_sources')
      .select('code, name')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (sourceError) {
      if (!body?.auto_register && !isSpecialEvent) {
        console.error('[deals/from-calendar] source fetch error:', sourceError);
        return NextResponse.json({ error: 'source_fetch_failed', message: sourceError.message }, { status: 500 });
      }
      console.warn('[deals/from-calendar] source fetch failed in auto-register; continuing without source master', sourceError);
    }

    const { data: agencyRows, error: agencyError } = await supabase
      .from('m_agencies')
      .select('code')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (agencyError) {
      if (!body?.auto_register && !isSpecialEvent) {
        console.error('[deals/from-calendar] agency fetch error:', agencyError);
        return NextResponse.json({ error: 'agency_fetch_failed', message: agencyError.message }, { status: 500 });
      }
      console.warn('[deals/from-calendar] agency fetch failed in auto-register; continuing without agency master', agencyError);
    }

    const sourceCodes = Array.from(
      new Set([
        ...(sourceRows ?? []).map((r) => r.code),
        ...((body?.source_codes ?? [])
          .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          .map((v) => v.trim())),
      ])
    );
    const agencyCodes = Array.from(
      new Set([
        ...(agencyRows ?? []).map((r) => r.code),
        ...((body?.agency_codes ?? [])
          .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          .map((v) => v.trim())),
      ])
    );
    const fallbackSourceCode =
      sourceRows?.find((row) => row.name === '流入経路なし' || row.name === '不明')?.code ??
      body?.source_codes?.find((code) => typeof code === 'string' && code.trim())?.trim() ??
      sourceRows?.[0]?.code ??
      null;
    const autoRegister = body?.auto_register === true || isSpecialEvent;
    const resolvedAssignedToId = await resolveAssignedToId(supabase, session);
    if (!resolvedAssignedToId) {
      return NextResponse.json({ error: 'assigned_to_unavailable', message: '担当ユーザーを解決できませんでした' }, { status: 500 });
    }

    const resolvedSourceCode = autoRegister
      ? resolveSourceCodeForAutoRegister(body.source, sourceCodes, fallbackSourceCode)
      : (typeof body.source === 'string' && body.source.trim() ? body.source.trim() : '');

    const sourceValue = resolvedSourceCode ?? fallbackSourceCode ?? draft.source;
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
      typeof body.age === 'string' || typeof body.age === 'number'
        ? String(body.age)
        : typeof body.custom_data?.age === 'string' || typeof body.custom_data?.age === 'number'
        ? String(body.custom_data.age)
        : parsed.age || extractCalendarField([event.summary, event.description], '年齢') || '';
    const emailValue =
      typeof body.custom_data?.email === 'string'
        ? body.custom_data.email
        : parsed.email || extractCalendarField([event.summary, event.description], 'メールアドレス') || '';
    const phoneValue =
      typeof body.custom_data?.phone === 'string'
        ? body.custom_data.phone
        : parsed.phone || extractCalendarField([event.summary, event.description], '電話番号') || '';

    const validation = validateCalendarDealInput(
      {
        customer_name: customerNameValue,
        assigned_to:
          typeof body.assigned_to === 'string' && body.assigned_to.trim()
            ? body.assigned_to.trim()
            : resolvedAssignedToId,
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
        requireSourceOrReferrer: false,
        skipSourceCodeValidation: true,
        skipAgencyCodeValidation: true,
      }
    );

    const sourceCode = validation.normalized.source || null;
    const agencyCode = validation.normalized.referrer || null;
    const retirementDate = validation.normalized.retirement_date;
    const customerName = validation.normalized.customer_name;
    const dealDate = validation.normalized.deal_date;
    const email = validation.normalized.email || undefined;
    const phone = validation.normalized.phone || undefined;
    const dealNotesValue = draft.deal_notes?.trim() ? draft.deal_notes : null;

    // 退職前サポートの自動登録は、後から編集できる項目（退職予定日・年齢・メールアドレス・流入経路）を
    // 厳密な必須条件にしない。ここで弾くと、説明欄に不足がある予定が自動登録できずに
    // 失敗扱いになってしまう。
    const blockingErrors = Object.fromEntries(
      Object.entries(validation.errors).filter(([field]) => {
        if (!autoRegister) return true;
        return field !== 'age' && field !== 'email' && field !== 'retirement_date' && field !== 'source' && field !== 'referrer';
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

    let existing: { id: string } | null = null;
    try {
      existing = await findExistingCalendarDeal(supabase, {
        calendarEventId: draft.calendar_event_id,
        customerName,
        dealDate,
        dealNotes: dealNotesValue,
        assignedToId: resolvedAssignedToId,
      });
    } catch (existingError) {
      console.error('[deals/from-calendar] existing check error:', existingError);
      const message = existingError instanceof Error ? existingError.message : 'existing_check_failed';
      return NextResponse.json({ error: 'existing_check_failed', message }, { status: 500 });
    }

    if (existing?.id) {
      return NextResponse.json(
        { error: 'already_registered', message: '既に商談化済みです', deal_id: existing.id },
        { status: 409 }
      );
    }

    const dealId = buildDealId(draft.calendar_event_id);
    const payload = {
      id: dealId,
      customer_name: customerName,
      assigned_to: resolvedAssignedToId,
      deal_date: dealDate,
      deal_notes: dealNotesValue,
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
      created_by: resolvedAssignedToId,
      updated_by: resolvedAssignedToId,
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

    const { error } = await writeDealWithMissingColumnFallback(
      'deals/from-calendar insert',
      payload,
      async (writePayload) => await supabase.from('deals').insert(writePayload)
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
