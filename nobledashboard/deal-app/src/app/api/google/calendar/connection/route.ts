import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { data: googleAccount, error: lookupError } = await supabase
      .from('google_accounts')
      .select('refresh_token')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: 'google_account_lookup_failed' }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from('google_accounts')
      .delete()
      .eq('user_id', session.user.id);

    if (deleteError) {
      return NextResponse.json({ error: 'google_disconnect_failed' }, { status: 500 });
    }

    const tokenToRevoke = googleAccount?.refresh_token;
    if (tokenToRevoke) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          cache: 'no-store',
        });
      } catch {
        // App-side disconnect has already completed even if provider revoke fails.
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'google_disconnect_failed',
      },
      { status: 500 }
    );
  }
}
