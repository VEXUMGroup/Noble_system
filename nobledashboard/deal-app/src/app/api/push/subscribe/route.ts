import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { savePushSubscription, type PushSubscriptionJson } from '@/lib/push-notifications';

export async function POST(request: NextRequest) {
  const session = await readAppSessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { subscription?: PushSubscriptionJson; device_name?: string }
    | null;

  const subscription = body?.subscription;
  if (
    !subscription ||
    typeof subscription.endpoint !== 'string' ||
    !subscription.endpoint ||
    !subscription.keys?.auth ||
    !subscription.keys?.p256dh
  ) {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 });
  }

  try {
    await savePushSubscription(
      session.userId,
      subscription,
      body?.device_name ?? null,
      request.headers.get('user-agent')
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'subscription_save_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

