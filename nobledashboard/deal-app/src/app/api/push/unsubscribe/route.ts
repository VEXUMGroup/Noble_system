import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { removePushSubscription } from '@/lib/push-notifications';

export async function POST(request: NextRequest) {
  const session = await readAppSessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: 'missing_endpoint' }, { status: 400 });
  }

  try {
    await removePushSubscription(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unsubscribe_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

