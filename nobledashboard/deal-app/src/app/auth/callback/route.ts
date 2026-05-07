import { NextResponse, type NextRequest } from 'next/server';
import {
  getSafeNextPath,
  getSessionState,
} from '@/lib/auth/access';
import { hasSupabaseCredentials } from '@/lib/supabase-auth/config';
import { createServerSupabaseClient } from '@/lib/supabase-auth/server';

export async function GET(request: NextRequest) {
  if (!hasSupabaseCredentials()) {
    return redirectToLogin(request, 'config_missing');
  }

  const requestUrl = new URL(request.url);
  const authError = requestUrl.searchParams.get('error');
  const code = requestUrl.searchParams.get('code');
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'));

  if (authError) {
    return redirectToLogin(request, 'oauth_cancelled');
  }

  if (!code) {
    return redirectToLogin(request, 'auth_callback');
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToLogin(request, 'auth_callback');
  }

  const sessionState = await getSessionState(supabase);

  if (sessionState.status === 'unauthorized') {
    await supabase.auth.signOut();
    return redirectToLogin(request, 'user_not_authorized');
  }

  if (sessionState.status !== 'authenticated') {
    return redirectToLogin(request, 'auth_callback');
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}

function redirectToLogin(request: NextRequest, error: string) {
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('error', error);
  return NextResponse.redirect(redirectUrl);
}
