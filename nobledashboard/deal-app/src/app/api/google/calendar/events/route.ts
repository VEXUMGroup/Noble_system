import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchICalEvents } from '@/lib/ical';

export async function GET() {
  try {
    const session = readAppSessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Supabase から iCal URL を取得
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('user_calendar_settings')
      .select('ical_url')
      .eq('user_id', session.userId)
      .maybeSingle();

    if (error) {
      throw new Error(`settings_fetch_failed: ${error.message}`);
    }

    if (!data?.ical_url) {
      return NextResponse.json({ error: 'ical_not_configured', items: [] }, { status: 200 });
    }

    const events = await fetchICalEvents(data.ical_url, 7);
    // GoogleCalendarPanel が期待する shape に合わせる
    const items = events.map((ev) => ({
      id: ev.id,
      summary: ev.summary,
      start: { dateTime: ev.start.toISOString() },
      end: { dateTime: ev.end.toISOString() },
      location: ev.location,
      description: ev.description ?? null,
      htmlLink: ev.url,
    }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[calendar/events] iCal fetch error:', err);
    const message = err instanceof Error ? err.message : 'ical_fetch_failed';
    const looksConfiguredError =
      !message.startsWith('settings_fetch_failed') && message !== 'unauthorized';
    // 想定外例外でも HTML 500 を返さず、常に JSON で返す
    return NextResponse.json(
      { error: message, configured: looksConfiguredError, items: [] },
      { status: 200 }
    );
  }
}
