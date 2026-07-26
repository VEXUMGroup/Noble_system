'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppNotification } from '@/lib/notifications';

type NotificationResponse = {
  notification: AppNotification | null;
};

export function useNotificationDetail(notificationId: string) {
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotification = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/notifications/${notificationId}`, { cache: 'no-store' });
      if (res.status === 404) {
        setNotification(null);
        setError(null);
        return;
      }
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'notification_fetch_failed');
      }

      const payload = (await res.json()) as NotificationResponse;
      setNotification(payload.notification ?? null);
      setError(null);
    } catch (fetchError) {
      setNotification(null);
      setError(fetchError instanceof Error ? fetchError.message : 'notification_fetch_failed');
    } finally {
      setIsLoading(false);
    }
  }, [notificationId]);

  useEffect(() => {
    void fetchNotification();
  }, [fetchNotification]);

  return {
    notification,
    isLoading,
    error,
    setNotification,
    refresh: fetchNotification,
  };
}
