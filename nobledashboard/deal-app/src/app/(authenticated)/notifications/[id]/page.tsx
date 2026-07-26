'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';
import { dispatchNotificationsUpdated } from '@/lib/notification-events';
import { formatNotificationDateTime } from '@/lib/notifications';
import { useNotificationDetail } from '@/lib/useNotificationDetail';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function NotificationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { notification, isLoading, error, setNotification } = useNotificationDetail(params.id);
  const markRequestedRef = useRef(false);

  useEffect(() => {
    if (!notification || notification.isRead || markRequestedRef.current) return;
    markRequestedRef.current = true;

    void (async () => {
      const res = await fetch(`/api/notifications/${params.id}/read`, {
        method: 'POST',
      });

      if (!res.ok) {
        markRequestedRef.current = false;
        return;
      }

      const payload = (await res.json()) as { readAt?: string };
      setNotification((current) =>
        current
          ? {
              ...current,
              isRead: true,
              readAt: payload.readAt ?? current.readAt,
            }
          : current
      );
      dispatchNotificationsUpdated();
    })();
  }, [notification, params.id, setNotification]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        通知を読み込み中です...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        通知の取得に失敗しました。{error}
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <p className="text-base font-semibold text-gray-900">通知が見つかりません。</p>
        <Link href="/notifications" className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
          通知センターへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/notifications" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          通知センターへ戻る
        </Link>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            notification.isRead ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {notification.isRead ? '既読' : '未読'}
        </span>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-50 p-3 text-blue-600">
            <NotificationIcon type={notification.type} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-blue-700">{notification.title}</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{notification.message}</h1>
            <p className="mt-3 text-sm text-gray-500">{formatNotificationDateTime(notification.createdAt)}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold text-gray-900">通知内容</h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">{notification.message}</p>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">関連商談</h2>
          {notification.relatedDeal ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {notification.relatedDeal.customerName ?? notification.relatedDeal.id}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-xs text-gray-500">商談ID: {notification.relatedDeal.id}</p>
                  {notification.relatedDeal.status && <StatusBadge status={notification.relatedDeal.status} />}
                </div>
              </div>
              <Link
                href={`/deals/${notification.relatedDeal.id}`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                商談詳細を開く
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">関連商談は設定されていません。</p>
          )}
        </div>
      </div>
    </div>
  );
}
