import { NextRequest, NextResponse } from 'next/server';
import { readAppSessionCookie } from '@/lib/auth/app-session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildPaymentReminderTargets, type PaymentReminderDeal, type PaymentReminderRecord } from '@/lib/payment-reminders';
import {
  getActivePushSubscriptions,
  insertNotificationLog,
  sendPushNotifications,
} from '@/lib/push-notifications';
import { getNotificationDetailUrl } from '@/lib/notifications';
import { resolveNotificationRecipientUserIds } from '@/lib/notification-targets';
import { addDaysToYmd, getJstTodayYmd } from '@/lib/date-utils';

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
    const todayYmd = getJstTodayYmd();
    const targetDate = addDaysToYmd(todayYmd, 3);

    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, customer_name, assigned_to, payment_deadline, amount')
      .eq('payment_deadline', targetDate);

    if (dealsError) {
      return NextResponse.json({ error: dealsError.message }, { status: 500 });
    }

    const dueDeals = (deals ?? []) as PaymentReminderDeal[];
    if (dueDeals.length === 0) {
      return NextResponse.json({ ok: true, targetDate, reminders: 0, sent: 0, failures: 0 });
    }

    const dealIds = dueDeals.map((deal) => deal.id);
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('deal_id, amount')
      .in('deal_id', dealIds);

    if (paymentsError) {
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    const targets = buildPaymentReminderTargets(
      dueDeals,
      (payments ?? []) as PaymentReminderRecord[],
      new Date()
    );

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

      const message = `支払期日3日前です。${target.customerName} 様は未入金です。`;
      for (const recipientUserId of recipientUserIds) {
        const logResult = await insertNotificationLog({
          notificationKey: `${target.reminderKey}:${recipientUserId}`,
          userId: recipientUserId,
          dealId: target.dealId,
          message,
          type: 'payment_due_3days',
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
            title: '支払期日3日前の未入金通知',
            body: `${target.customerName} 様の入金期日が ${target.paymentDeadline} です。`,
            url: targetUrl,
            tag: `${target.reminderKey}:${recipientUserId}`,
            data: {
              url: targetUrl,
              notificationId: logResult.id,
              dealId: target.dealId,
              customerName: target.customerName,
              paymentDeadline: target.paymentDeadline,
              amount: target.amount,
              unpaidAmount: target.unpaidAmount,
            },
          },
        );

        sent += result.sent;
        failures += result.failures;
      }
    }

    return NextResponse.json({
      ok: true,
      targetDate,
      reminders: targets.length,
      sent,
      failures,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'internal_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
