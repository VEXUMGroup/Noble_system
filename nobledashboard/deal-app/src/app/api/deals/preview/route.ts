import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { formatEventForDeal, parseLStepCalendarDescription, type ICalEvent } from '@/lib/ical';

/**
 * Preview endpoint – parses the iCal description and returns the fields that will be
 * auto‑filled when a deal is finally registered.
 *
 * Expected request body:
 *   {
 *     event?: Partial<ICalEvent>;
 *     retirement_date?: string;
 *   }
 */
export async function POST(request: NextRequest) {
  const session = await readAppSessionCookie();
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

  // Build the draft data that the UI will show as auto‑filled values.
  const draft = formatEventForDeal(event);
  const parsed = parseLStepCalendarDescription(event.description);
  const retirementDate = body.retirement_date || parsed.retirementDate;

  if (!retirementDate) {
    return NextResponse.json({ error: 'retirement_date_required' }, { status: 400 });
  }

  // Return only the fields that are automatically derived.
  const autoFields = {
    顧客名: draft.customer_name,
    担当者: session.userId, // the API only knows the user ID; front‑end can resolve name if needed
    退職予定日: retirementDate,
    商談日: draft.deal_date,
  };

  return NextResponse.json({ ok: true, autoFields, rawDraft: draft });
}
