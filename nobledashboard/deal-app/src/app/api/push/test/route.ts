import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { getActivePushSubscriptions, sendPushNotifications } from '@/lib/push-notifications';

export async function POST() {
  const session = await readAppSessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const subscriptions = await getActivePushSubscriptions(session.userId);
    if (subscriptions.length === 0) {
      return NextResponse.json({ error: 'subscription_not_found' }, { status: 404 });
    }

    const result = await sendPushNotifications(
      subscriptions.map((subscription) => subscription.subscription),
      {
        title: 'テスト通知',
        body: 'スマホ通知のテスト送信です。通知設定は正常です。',
        url: '/notifications',
        tag: `push-test:${session.userId}`,
        data: {
          url: '/notifications',
          type: 'push_test',
          sentAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      failures: result.failures,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'push_test_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
