import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchICalEvents } from '@/lib/ical';

export async function GET() {
  const session = readAppSessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Supabase から iCal URL を取得
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('user_calendar_settings')
    .select('ical_url')
    .eq('user_id', session.userId)
    .maybeSingle();

  if (!data?.ical_url) {
    return NextResponse.json({ error: 'ical_not_configured', items: [] }, { status: 200 });
  }

  try {
    const events = await fetchICalEvents(data.ical_url, 7);
    // GoogleCalendarPanel が期待する shape に合わせる
    const items = events.map((ev) => ({
      id: ev.id,
      summary: ev.summary,
      start: { dateTime: ev.start.toISOString() },
      end: { dateTime: ev.end.toISOString() },
      location: ev.location,
      htmlLink: ev.url,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[calendar/events] iCal fetch error:', err);
    const message = err instanceof Error ? err.message : 'ical_fetch_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
