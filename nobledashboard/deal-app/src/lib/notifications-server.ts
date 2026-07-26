import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { AppNotification, getNotificationDetailUrl, getNotificationTitle } from '@/lib/notifications';

type NotificationRow = {
  id: number;
  user_id: string;
  deal_id: string | null;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  notification_key: string | null;
};

const NOTIFICATION_SELECT_BASE =
  'id, user_id, deal_id, type, message, is_read, created_at, notification_key';
const NOTIFICATION_SELECT_WITH_READ_AT = `${NOTIFICATION_SELECT_BASE}, read_at`;

function isMissingNotificationColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, message, details } = error as { code?: string; message?: string; details?: string };
  const haystack = `${code ?? ''} ${message ?? ''} ${details ?? ''}`.toLowerCase();

  return (
    (code === '42703' || code === 'PGRST204' || haystack.includes('does not exist') || haystack.includes('could not find')) &&
    haystack.includes(column.toLowerCase())
  );
}

function normalizeNotificationRows(rows: Record<string, unknown>[] | null | undefined) {
  return (rows ?? []).map((row) => ({
    ...row,
    read_at: 'read_at' in row ? (row.read_at as string | null) : null,
  })) as NotificationRow[];
}

async function selectNotificationRows(
  queryFactory: (columns: string) => Promise<{ data: unknown; error: unknown }>
) {
  const first = await queryFactory(NOTIFICATION_SELECT_WITH_READ_AT);
  if (!first.error) {
    return normalizeNotificationRows(first.data as Record<string, unknown>[] | null | undefined);
  }

  if (!isMissingNotificationColumnError(first.error, 'read_at')) {
    throw first.error;
  }

  const fallback = await queryFactory(NOTIFICATION_SELECT_BASE);
  if (fallback.error) {
    throw fallback.error;
  }

  return normalizeNotificationRows(fallback.data as Record<string, unknown>[] | null | undefined);
}

type DealRow = {
  id: string;
  customer_name: string | null;
  status: string | null;
};

async function fetchDealsByIds(dealIds: string[]) {
  if (dealIds.length === 0) {
    return new Map<string, DealRow>();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('deals')
    .select('id, customer_name, status')
    .in('id', dealIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((deal) => [deal.id, deal as DealRow]));
}

function toAppNotification(row: NotificationRow, dealsById: Map<string, DealRow>): AppNotification {
  const relatedDeal = row.deal_id ? dealsById.get(row.deal_id) ?? null : null;

  return {
    id: row.id,
    userId: row.user_id,
    dealId: row.deal_id,
    type: row.type,
    title: getNotificationTitle(row.type),
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at,
    notificationKey: row.notification_key,
    detailUrl: getNotificationDetailUrl(row.id),
    relatedDeal: relatedDeal
      ? {
          id: relatedDeal.id,
          customerName: relatedDeal.customer_name,
          status: relatedDeal.status,
        }
      : null,
  };
}

export async function listUserNotifications(userId: string, limit = 50) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const supabase = createSupabaseAdminClient();
  const rows = await selectNotificationRows(async (columns) =>
    await supabase
      .from('notifications')
      .select(columns)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(safeLimit)
  );
  const dealsById = await fetchDealsByIds(
    Array.from(new Set(rows.map((row) => row.deal_id).filter((dealId): dealId is string => Boolean(dealId))))
  );

  return rows.map((row) => toAppNotification(row, dealsById));
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getUserNotificationById(userId: string, notificationId: number) {
  const supabase = createSupabaseAdminClient();
  const rows = await selectNotificationRows(async (columns) =>
    await supabase
      .from('notifications')
      .select(columns)
      .eq('id', notificationId)
      .eq('user_id', userId)
      .limit(1)
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const dealsById = await fetchDealsByIds(row.deal_id ? [row.deal_id] : []);
  return toAppNotification(row, dealsById);
}

export async function markNotificationAsRead(userId: string, notificationId: number) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const payload = {
    is_read: true,
    read_at: now,
    updated_at: now,
  };

  const first = await supabase
    .from('notifications')
    .update(payload)
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (first.error) {
    if (!isMissingNotificationColumnError(first.error, 'read_at')) {
      throw new Error(first.error.message);
    }

    const fallback = await supabase
      .from('notifications')
      .update({
        is_read: true,
        updated_at: now,
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (fallback.error) {
      throw new Error(fallback.error.message);
    }
  }

  return now;
}
