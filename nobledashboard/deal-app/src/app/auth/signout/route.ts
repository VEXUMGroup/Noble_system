import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabaseCredentials } from '@/lib/supabase-auth/config';
import { createServerSupabaseClient } from '@/lib/supabase-auth/server';

export async function GET(request: NextRequest) {
  if (hasSupabaseCredentials()) {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  const redirectUrl = new URL('/', request.url);
  const reason = request.nextUrl.searchParams.get('reason');

  if (reason) {
    redirectUrl.searchParams.set('error', reason);
  }

  return NextResponse.redirect(redirectUrl);
}
