import { NextRequest, NextResponse } from 'next/server';
import { getSafeNextPath } from '@/lib/auth/access';
import { createSessionToken } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextPath = getSafeNextPath(url.searchParams.get('next'));
  const redirectUrl = new URL(nextPath, url.origin);

  if (!code) {
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.set('error', 'missing_callback_params');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('error', 'oauth_exchange_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('error', 'missing_user_email');
      return NextResponse.redirect(redirectUrl);
    }

    const admin = createSupabaseAdminClient();
    const { data: member } = await admin
      .from('m_users')
      .select('id, name, email, role, is_active')
      .ilike('email', user.email.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (!member?.id) {
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('error', 'unauthorized_user');
      return NextResponse.redirect(redirectUrl);
    }

    const sessionToken = createSessionToken({
      email: member.email,
      userId: member.id,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('app_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.set('error', 'auth_callback');
    return NextResponse.redirect(redirectUrl);
  }
}
