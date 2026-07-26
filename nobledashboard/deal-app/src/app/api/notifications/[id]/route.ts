import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { getUserNotificationById } from '@/lib/notifications-server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await readAppSessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const notificationId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(notificationId)) {
    return NextResponse.json({ error: 'invalid_notification_id' }, { status: 400 });
  }

  try {
    const notification = await getUserNotificationById(session.userId, notificationId);
    if (!notification) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notification_fetch_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
