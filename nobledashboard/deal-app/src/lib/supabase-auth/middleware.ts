import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSessionState } from '@/lib/auth/access';
import { getOptionalSupabaseCredentials } from './config';

export async function updateSession(request: NextRequest) {
  const credentials = getOptionalSupabaseCredentials();

  if (!credentials) {
    return redirectToLogin(request, 'config_missing');
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(credentials.url, credentials.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const sessionState = await getSessionState(supabase);

  if (sessionState.status === 'authenticated') {
    return supabaseResponse;
  }

  if (sessionState.status === 'unauthorized') {
    await supabase.auth.signOut();
    return redirectToLogin(request, 'user_not_authorized', supabaseResponse);
  }

  return redirectToLogin(request, 'login_required', supabaseResponse);
}

function redirectToLogin(
  request: NextRequest,
  error: string,
  sourceResponse?: NextResponse
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/';
  redirectUrl.search = '';
  redirectUrl.searchParams.set('error', error);

  const response = NextResponse.redirect(redirectUrl);

  sourceResponse?.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}
