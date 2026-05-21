import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET: 保存済み iCal URL を取得
export async function GET() {
  const session = readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('user_calendar_settings')
    .select('ical_url')
    .eq('user_id', session.userId)
    .maybeSingle();

  return NextResponse.json({ ical_url: data?.ical_url ?? null });
}

// PUT: iCal URL を保存（なければ作成、あれば更新）
export async function PUT(req: NextRequest) {
  const session = readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const icalUrl = typeof body?.ical_url === 'string' ? body.ical_url.trim() : '';

  if (!icalUrl) {
    return NextResponse.json({ error: 'ical_url is required' }, { status: 400 });
  }

  // 簡易バリデーション
  if (!icalUrl.startsWith('https://calendar.google.com/calendar/ical/')) {
    return NextResponse.json(
      { error: 'Google カレンダーの iCal URL を入力してください' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('user_calendar_settings')
    .upsert(
      { user_id: session.userId, ical_url: icalUrl, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[ical-url PUT] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: iCal URL を削除
export async function DELETE() {
  const session = readAppSessionCookie();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  await supabase
    .from('user_calendar_settings')
    .delete()
    .eq('user_id', session.userId);

  return NextResponse.json({ ok: true });
}
