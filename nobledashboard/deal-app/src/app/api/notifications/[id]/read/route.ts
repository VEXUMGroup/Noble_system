import { NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { markNotificationAsRead } from '@/lib/notifications-server';

export async function POST(
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
    const readAt = await markNotificationAsRead(session.userId, notificationId);
    return NextResponse.json({ ok: true, readAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'notification_read_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
