export type NotificationType =
  | 'payment_due_3days'
  | 'next_action_today'
  | 'retirement_alert'
  | 'deal_contracted'
  | 'approval_rejected'
  | string;

export type AppNotification = {
  id: number;
  userId: string;
  dealId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  notificationKey: string | null;
  detailUrl: string;
  relatedDeal: {
    id: string;
    customerName: string | null;
    status: string | null;
  } | null;
};

export function getNotificationTitle(type: NotificationType) {
  switch (type) {
    case 'payment_due_3days':
      return '支払期日3日前の未入金通知';
    case 'next_action_today':
      return '本日の次回アクション通知';
    case 'retirement_alert':
      return '退職日アラート';
    case 'deal_contracted':
      return '成約通知';
    case 'approval_rejected':
      return '事務承認差し戻し通知';
    default:
      return '通知';
  }
}

export function getNotificationDetailUrl(id: number | string) {
  return `/notifications/${id}`;
}

export function formatNotificationDateTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
