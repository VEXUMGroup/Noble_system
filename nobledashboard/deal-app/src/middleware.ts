import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from './lib/supabase/admin';

const COOKIE_NAME = 'app_session';

function getAuthSecret() {
  const secret = process.env.APP_AUTH_SECRET;
  if (!secret) return null;
  return secret;
}

async function signHex(secret: string, data: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlDecode(input: string) {
  const normalized = input.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function readSessionFromCookie(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const secret = getAuthSecret();
    if (!token || !secret) return null;
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    if ((await signHex(secret, encoded)) !== signature) return null;
    const decoded = base64UrlDecode(encoded);
    const payload = JSON.parse(decoded) as { email?: string; userId?: string; exp?: number };
    if (!payload?.email || !payload?.userId || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest, error?: string) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  if (error) loginUrl.searchParams.set('error', error);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();

    const session = await readSessionFromCookie(request);
    if (!session) {
      return redirectToLogin(request);
    }

    const supabase = createSupabaseAdminClient();
    const { data: member, error } = await supabase
      .from('m_users')
      .select('id, is_active')
      .eq('id', session.userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[middleware] member lookup failed', {
        message: error.message,
        code: error.code,
      });
      return redirectToLogin(request, 'internal_error');
    }

    if (!member) {
      return redirectToLogin(request, 'unauthorized_user');
    }

    return response;
  } catch (error) {
    console.error('[middleware] unexpected error', error);
    return redirectToLogin(request, 'internal_error');
  }
}

export const config = {
  matcher: ['/deals/:path*', '/master/:path*', '/review/:path*', '/payments/:path*'],
};
