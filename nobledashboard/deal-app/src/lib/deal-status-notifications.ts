import { getNotificationDetailUrl } from '@/lib/notifications';
import { resolveNotificationRecipientUserIds } from '@/lib/notification-targets';
import {
  getActivePushSubscriptions,
  insertNotificationLog,
  sendPushNotifications,
} from '@/lib/push-notifications';

export type DealNotificationSnapshot = {
  id: string;
  customer_name: string | null;
  assigned_to: string | null;
  status: string | null;
  result_status: string | null;
  interview_status: string | null;
};

const CONTRACT_RESULT_STATUSES = new Set(['RS_CONTRACT', 'CONTRACTED', '成約']);
const APPROVAL_REJECTABLE_STATUSES = new Set(['DETAIL_ENTERED', 'APPROVED']);
const INTERVIEW_COMPLETED_STATUSES = new Set(['ST_MEETING', 'INTERVIEWED']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeText(value: unknown) {
  return isNonEmptyString(value) ? value.trim() : '';
}

function isContractedStatus(value: unknown) {
  return CONTRACT_RESULT_STATUSES.has(normalizeText(value));
}

export function shouldNotifyDealContracted(params: {
  previousDeal: DealNotificationSnapshot;
  nextDeal: DealNotificationSnapshot;
  patch: Record<string, unknown>;
}) {
  const { previousDeal, nextDeal, patch } = params;
  const hasExplicitResultUpdate = Object.prototype.hasOwnProperty.call(patch, 'result_status');
  const wasAlreadyContracted =
    isContractedStatus(previousDeal.status) || isContractedStatus(previousDeal.result_status);
  const becameContracted =
    isContractedStatus(nextDeal.status) || isContractedStatus(nextDeal.result_status);
  const hasInterviewEvidence =
    isNonEmptyString(nextDeal.interview_status) ||
    isNonEmptyString(previousDeal.interview_status) ||
    INTERVIEW_COMPLETED_STATUSES.has(normalizeText(previousDeal.status)) ||
    INTERVIEW_COMPLETED_STATUSES.has(normalizeText(nextDeal.status));

  return hasExplicitResultUpdate && !wasAlreadyContracted && becameContracted && hasInterviewEvidence;
}

export function shouldNotifyApprovalRejected(params: {
  previousDeal: DealNotificationSnapshot;
  nextDeal: DealNotificationSnapshot;
  patch: Record<string, unknown>;
}) {
  const { previousDeal, nextDeal, patch } = params;
  const hasExplicitResultUpdate = Object.prototype.hasOwnProperty.call(patch, 'result_status');
  const comment = normalizeText(patch.memo);

  return (
    !hasExplicitResultUpdate &&
    comment.length > 0 &&
    normalizeText(nextDeal.status) === 'CONTRACTED' &&
    APPROVAL_REJECTABLE_STATUSES.has(normalizeText(previousDeal.status))
  );
}

export async function sendDealContractedNotifications(params: {
  deal: DealNotificationSnapshot;
  eventKey: string;
}) {
  const recipientUserIds = await resolveNotificationRecipientUserIds({
    audience: 'admin_staff',
  });

  if (recipientUserIds.length === 0) {
    return { sent: 0, failures: 0, notifications: 0 };
  }

  let sent = 0;
  let failures = 0;
  let notifications = 0;
  const customerName = params.deal.customer_name ?? '顧客';
  const message = `${customerName} 様が成約になりました。事務承認をお願いします。`;

  for (const recipientUserId of recipientUserIds) {
    const logResult = await insertNotificationLog({
      notificationKey: `${params.eventKey}:${recipientUserId}`,
      userId: recipientUserId,
      dealId: params.deal.id,
      message,
      type: 'deal_contracted',
    });

    if (!logResult.inserted) {
      continue;
    }

    notifications += 1;

    const subscriptions = await getActivePushSubscriptions(recipientUserId);
    if (subscriptions.length === 0) {
      continue;
    }

    const targetUrl = logResult.id ? getNotificationDetailUrl(logResult.id) : '/notifications';
    const result = await sendPushNotifications(
      subscriptions.map((subscription) => subscription.subscription),
      {
        title: '成約通知',
        body: `${customerName} 様が成約になりました。事務承認をお願いします。`,
        url: targetUrl,
        tag: `${params.eventKey}:${recipientUserId}`,
        data: {
          url: targetUrl,
          notificationId: logResult.id,
          dealId: params.deal.id,
          customerName,
          type: 'deal_contracted',
        },
      }
    );

    sent += result.sent;
    failures += result.failures;
  }

  return { sent, failures, notifications };
}

export async function sendApprovalRejectedNotifications(params: {
  deal: DealNotificationSnapshot;
  comment: string;
  eventKey: string;
}) {
  const recipientUserIds = await resolveNotificationRecipientUserIds({
    audience: 'sales',
    assignedTo: params.deal.assigned_to,
  });

  if (recipientUserIds.length === 0) {
    return { sent: 0, failures: 0, notifications: 0 };
  }

  let sent = 0;
  let failures = 0;
  let notifications = 0;
  const customerName = params.deal.customer_name ?? '顧客';
  const trimmedComment = params.comment.trim();
  const message = `${customerName} 様の事務承認が差し戻しされました。コメント: ${trimmedComment}`;

  for (const recipientUserId of recipientUserIds) {
    const logResult = await insertNotificationLog({
      notificationKey: `${params.eventKey}:${recipientUserId}`,
      userId: recipientUserId,
      dealId: params.deal.id,
      message,
      type: 'approval_rejected',
    });

    if (!logResult.inserted) {
      continue;
    }

    notifications += 1;

    const subscriptions = await getActivePushSubscriptions(recipientUserId);
    if (subscriptions.length === 0) {
      continue;
    }

    const targetUrl = logResult.id ? getNotificationDetailUrl(logResult.id) : '/notifications';
    const result = await sendPushNotifications(
      subscriptions.map((subscription) => subscription.subscription),
      {
        title: '事務承認差し戻し通知',
        body: `${customerName} 様の承認が差し戻しされました。`,
        url: targetUrl,
        tag: `${params.eventKey}:${recipientUserId}`,
        data: {
          url: targetUrl,
          notificationId: logResult.id,
          dealId: params.deal.id,
          customerName,
          comment: trimmedComment,
          type: 'approval_rejected',
        },
      }
    );

    sent += result.sent;
    failures += result.failures;
  }

  return { sent, failures, notifications };
}
