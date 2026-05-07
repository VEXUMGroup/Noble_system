import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const GOOGLE_CALENDAR_SCOPES =
  'openid email profile https://www.googleapis.com/auth/calendar.readonly';

function isAuthDebugEnabled() {
  return (
    process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' ||
    process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true' ||
    process.env.AUTH_DEBUG === '1' ||
    process.env.AUTH_DEBUG === 'true'
  );
}

function safeLogPayload(payload: Record<string, unknown>) {
  const redactedKeys = new Set([
    'code',
    'access_token',
    'refresh_token',
    'provider_token',
    'provider_refresh_token',
    'token',
    'secret',
    'password',
  ]);

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (redactedKeys.has(key)) return [key, '<redacted>'];
      return [key, value];
    })
  );
}

function authDebug(event: string, payload: Record<string, unknown>) {
  if (!isAuthDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.info(`[auth-debug] ${event}`, safeLogPayload(payload));
}

function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get('next'));

  authDebug('callback_request', {
    origin: requestUrl.origin,
    path: requestUrl.pathname,
    nextPath,
    hasCode: Boolean(code),
    codeLength: code?.length ?? 0,
    cookieNames: request.cookies.getAll().map((cookie) => cookie.name),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    host: request.headers.get('host'),
    xForwardedHost: request.headers.get('x-forwarded-host'),
    xForwardedProto: request.headers.get('x-forwarded-proto'),
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    '';

  if (!supabaseUrl || !supabaseAnonKey) {
    authDebug('missing_supabase_env', {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    });
    return NextResponse.redirect(
      new URL(`/?error=missing_supabase_env&next=${encodeURIComponent(nextPath)}`, requestUrl.origin)
    );
  }

  if (!code) {
    authDebug('missing_code', {
      searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
    });
    return NextResponse.redirect(
      new URL(`/?error=missing_code&next=${encodeURIComponent(nextPath)}`, requestUrl.origin)
    );
  }

  let response = NextResponse.redirect(new URL(nextPath, requestUrl.origin));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const redirectWithError = async (errorCode: string) => {
    authDebug('redirect_with_error', { errorCode, nextPath });
    response = NextResponse.redirect(
      new URL(`/?error=${errorCode}&next=${encodeURIComponent(nextPath)}`, requestUrl.origin)
    );
    await supabase.auth.signOut();
    return response;
  };

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    authDebug('exchange_code_for_session_failed', {
      message: exchangeError.message,
      name: exchangeError.name,
      status: (exchangeError as unknown as { status?: number }).status,
      codePresent: Boolean(code),
    });
    return redirectWithError('oauth_exchange_failed');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  authDebug('post_exchange_session', {
    hasSession: Boolean(session),
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    identityProviders: user?.identities?.map((identity) => identity.provider) ?? [],
  });

  if (!session || !user?.id || !user.email) {
    return redirectWithError('missing_user_email');
  }

  const providerRefreshToken = (session as unknown as { provider_refresh_token?: string })
    ?.provider_refresh_token;
  const googleIdentity = user.identities?.find((identity) => identity.provider === 'google');
  const googleIdentityData =
    googleIdentity?.identity_data as { email?: string; sub?: string } | undefined;

  const { data: member, error: memberLookupError } = await supabase
    .from('m_users')
    .select('id, auth_user_id, is_active, email')
    .ilike('email', user.email)
    .eq('is_active', true)
    .maybeSingle();

  if (memberLookupError || !member) {
    return redirectWithError('unauthorized_user');
  }

  if (member.auth_user_id && member.auth_user_id !== user.id) {
    return redirectWithError('member_already_linked');
  }

  if (!member.auth_user_id) {
    const { error: linkError } = await supabase
      .from('m_users')
      .update({
        auth_user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)
      .ilike('email', user.email);

    if (linkError) {
      return redirectWithError('member_link_failed');
    }
  }

  const { data: existingGoogleAccount, error: existingGoogleAccountError } = await supabase
    .from('google_accounts')
    .select('refresh_token')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingGoogleAccountError) {
    return redirectWithError('google_account_save_failed');
  }

  const refreshToken = providerRefreshToken ?? existingGoogleAccount?.refresh_token ?? null;

  if (!refreshToken) {
    return redirectWithError('missing_google_refresh_token');
  }

  const { error: googleAccountError } = await supabase.from('google_accounts').upsert(
    {
      user_id: user.id,
      refresh_token: refreshToken,
      google_email: googleIdentityData?.email ?? user.email,
      google_sub: googleIdentityData?.sub ?? null,
      scopes: GOOGLE_CALENDAR_SCOPES,
      revoked_at: null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  );

  if (googleAccountError) {
    return redirectWithError('google_account_save_failed');
  }

  return response;
}
