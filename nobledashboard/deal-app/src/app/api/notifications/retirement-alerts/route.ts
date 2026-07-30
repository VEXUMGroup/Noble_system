import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildRetirementAlertTargets, type RetirementAlertDeal } from '@/lib/retirement-alerts';
import {
  getActivePushSubscriptions,
  insertNotificationLog,
  sendPushNotifications,
} from '@/lib/push-notifications';
import { getNotificationDetailUrl } from '@/lib/notifications';
import { resolveNotificationRecipientUserIds } from '@/lib/notification-targets';
import { getJstTodayYmd } from '@/lib/date-utils';

function isCronAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? process.env.NOTIFICATION_CRON_SECRET ?? '';
  if (!secret) return false;
  const authHeader = request.headers.get('authorization') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';
  return authHeader === `Bearer ${secret}` || token === secret;
}

export async function GET(request: NextRequest) {
  const cronAuthorized = isCronAuthorized(request);
  const session = cronAuthorized ? null : await readAppSessionCookie();

  if (!cronAuthorized && !session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, customer_name, assigned_to, status, retirement_date')
      .not('retirement_date', 'is', null);

    if (dealsError) {
      return NextResponse.json({ error: dealsError.message }, { status: 500 });
    }

    const targets = buildRetirementAlertTargets((deals ?? []) as RetirementAlertDeal[]);

    let sent = 0;
    let failures = 0;

    for (const target of targets) {
      const recipientUserIds = await resolveNotificationRecipientUserIds({
        audience: 'sales',
        assignedTo: target.assignedTo,
      });
      if (recipientUserIds.length === 0) {
        continue;
      }

      const message = `${target.customerName} 様の退職予定日まであと14日です。`;
      for (const recipientUserId of recipientUserIds) {
        const logResult = await insertNotificationLog({
          notificationKey: `${target.reminderKey}:${recipientUserId}`,
          userId: recipientUserId,
          dealId: target.dealId,
          message,
          type: 'retirement_alert',
        });

        if (!logResult.inserted) {
          continue;
        }

        const subscriptions = await getActivePushSubscriptions(recipientUserId);
        if (subscriptions.length === 0) {
          continue;
        }

        const targetUrl = logResult.id ? getNotificationDetailUrl(logResult.id) : '/notifications';

        const result = await sendPushNotifications(
          subscriptions.map((subscription) => subscription.subscription),
          {
            title: '退職日アラート',
            body: message,
            url: targetUrl,
            tag: `${target.reminderKey}:${recipientUserId}`,
            data: {
              url: targetUrl,
              notificationId: logResult.id,
              dealId: target.dealId,
              customerName: target.customerName,
              retirementDate: target.retirementDate,
              type: 'retirement_alert',
            },
          },
        );

        sent += result.sent;
        failures += result.failures;
      }
    }

    return NextResponse.json({
      ok: true,
      targetDate: getJstTodayYmd(),
      reminders: targets.length,
      sent,
      failures,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'internal_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
