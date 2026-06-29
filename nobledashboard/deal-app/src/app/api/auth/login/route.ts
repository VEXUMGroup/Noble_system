import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSessionToken, setAppSessionCookie } from '@/lib/auth/app-session';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = body?.email?.trim();

    if (!email) {
      return NextResponse.json({ error: 'missing_email' }, { status: 400 });
    }

    let supabase: ReturnType<typeof createSupabaseAdminClient>;
    try {
      supabase = createSupabaseAdminClient();
    } catch (caughtError) {
      console.error('[auth] failed to create supabase admin client', caughtError);
      return NextResponse.json({ error: 'missing_supabase_env' }, { status: 500 });
    }

    const { data: member, error } = await supabase
      .from('m_users')
      .select('id, email, is_active')
      .ilike('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[auth] member lookup failed', { message: error.message, code: error.code });
      return NextResponse.json({ error: 'member_lookup_failed' }, { status: 500 });
    }

    if (!member?.id || !member.email) {
      return NextResponse.json({ error: 'unauthorized_user' }, { status: 401 });
    }

    let token: string;
    try {
      token = createSessionToken({
        email: member.email,
        userId: member.id,
        exp: Date.now() + 1000 * 60 * 60 * 12, // 12h
      });
    } catch (caughtError) {
      console.error('[auth] failed to create session token', caughtError);
      return NextResponse.json({ error: 'missing_auth_secret' }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true });
    setAppSessionCookie(response, token);
    return response;
  } catch (caughtError) {
    console.error('[auth] unexpected error', caughtError);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
