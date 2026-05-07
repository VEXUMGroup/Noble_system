import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function hasGoogleRefreshConfig() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function createGoogleOAuthClient(accessToken: string | null, refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const oauth2Client =
    clientId && clientSecret
      ? new google.auth.OAuth2(clientId, clientSecret)
      : new google.auth.OAuth2();

  oauth2Client.setCredentials({
    access_token: accessToken ?? undefined,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('m_users')
      .select('id, is_active')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'unauthorized_user' }, { status: 403 });
    }

    const { data: googleAccount, error: googleAccountError } = await supabase
      .from('google_accounts')
      .select('refresh_token, revoked_at')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (googleAccountError) {
      return NextResponse.json({ error: 'google_account_lookup_failed' }, { status: 500 });
    }

    if (!googleAccount || googleAccount.revoked_at || !googleAccount.refresh_token) {
      return NextResponse.json({ error: 'google_not_connected' }, { status: 400 });
    }

    const providerToken = (session as unknown as { provider_token?: string })?.provider_token ?? null;

    if (!providerToken && !hasGoogleRefreshConfig()) {
      return NextResponse.json(
        { error: 'google_refresh_not_configured' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const timeMin = url.searchParams.get('timeMin') ?? new Date().toISOString();
    const timeMax = url.searchParams.get('timeMax');

    const oauth2Client = createGoogleOAuthClient(providerToken, googleAccount.refresh_token);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax: timeMax ?? undefined,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    });

    return NextResponse.json({ items: res.data.items ?? [], timeMin, timeMax });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'google_calendar_fetch_failed',
      },
      { status: 500 }
    );
  }
}
