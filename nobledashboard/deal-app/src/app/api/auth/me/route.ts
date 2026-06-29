import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const session = await readAppSessionCookie();
  if (!session) return NextResponse.json({ userId: null }, { status: 401 });

  try {
    const supabase = createSupabaseAdminClient();
    const { data: member } = await supabase
      .from('m_users')
      .select('id, role')
      .eq('id', session.userId)
      .maybeSingle();

    return NextResponse.json({
      userId: session.userId,
      email: session.email,
      role: member?.role ?? null,
    });
  } catch (error) {
    return NextResponse.json({ userId: session.userId, email: session.email, role: null }, { status: 200 });
  }
}
