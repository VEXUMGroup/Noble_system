import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  _request: Request,
  { params }: { params: { customerName: string } }
) {
  const session = readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const customerName = decodeURIComponent(params.customerName ?? '');
  if (!customerName) return NextResponse.json({ error: 'missing_customer_name' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('deals').delete().eq('customer_name', customerName);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

