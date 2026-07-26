'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppNotification } from '@/lib/notifications';
import { NOTIFICATIONS_UPDATED_EVENT } from '@/lib/notification-events';

type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};

export function useNotifications(limit = 20) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/notifications?limit=${limit}`, { cache: 'no-store' });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'notifications_fetch_failed');
      }

      const payload = (await res.json()) as NotificationsResponse;
      setNotifications(payload.notifications ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
      setError(null);
    } catch (fetchError) {
      setNotifications([]);
      setUnreadCount(0);
      setError(fetchError instanceof Error ? fetchError.message : 'notifications_fetch_failed');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchNotifications();

    const handleNotificationsUpdated = () => {
      void fetchNotifications();
    };

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
  };
}
