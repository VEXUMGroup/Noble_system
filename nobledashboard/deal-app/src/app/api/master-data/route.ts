import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const session = await readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const supabase = createSupabaseAdminClient();
    const [users, sources, plans, agencies, statuses] = await Promise.all([
      supabase.from('m_users').select('*').eq('is_active', true).order('name', { ascending: true }),
      supabase.from('m_sources').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('name', { ascending: true }),
      supabase.from('m_plans').select('*').eq('is_active', true).order('name', { ascending: true }),
      supabase.from('m_agencies').select('*').eq('is_active', true).order('name', { ascending: true }),
      supabase.from('m_statuses').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    ]);

    const firstError = users.error ?? sources.error ?? plans.error ?? agencies.error ?? statuses.error;
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    return NextResponse.json({
      users: users.data ?? [],
      sources: sources.data ?? [],
      plans: plans.data ?? [],
      agencies: agencies.data ?? [],
      statuses: statuses.data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'internal_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
