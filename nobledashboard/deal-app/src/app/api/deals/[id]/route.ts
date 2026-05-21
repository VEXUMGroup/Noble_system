import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const dealId = params.id;
  if (!dealId) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('deals').delete().eq('id', dealId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

