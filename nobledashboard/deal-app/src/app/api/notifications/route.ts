import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { getUnreadNotificationCount, listUserNotifications } from '@/lib/notifications-server';

export async function GET(request: NextRequest) {
  const session = await readAppSessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const limitParam = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);
    const limit = Number.isFinite(limitParam) ? limitParam : 20;
    const [notifications, unreadCount] = await Promise.all([
      listUserNotifications(session.userId, limit),
      getUnreadNotificationCount(session.userId),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notifications_fetch_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
