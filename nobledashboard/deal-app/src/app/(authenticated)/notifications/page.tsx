'use client';

import Link from 'next/link';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';
import { formatNotificationDateTime } from '@/lib/notifications';
import { useNotifications } from '@/lib/useNotifications';

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, error } = useNotifications(100);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">通知センター</h1>
          <p className="mt-1 text-sm text-gray-500">過去の通知一覧と関連商談への導線を確認できます。</p>
        </div>
        <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          未読 {unreadCount} 件
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          通知を読み込み中です...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          通知の取得に失敗しました。{error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.detailUrl}
                className={`block p-4 transition hover:bg-gray-50 sm:p-5 ${
                  notification.isRead ? 'bg-white' : 'bg-blue-50/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-white p-2 text-blue-600 ring-1 ring-gray-200">
                    <NotificationIcon type={notification.type} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-500">{formatNotificationDateTime(notification.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                    {notification.relatedDeal?.customerName && (
                      <p className="mt-2 text-xs text-gray-500">
                        関連商談: {notification.relatedDeal.customerName}
                      </p>
                    )}
                  </div>
                  {!notification.isRead && (
                    <span className="mt-2 inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-semibold text-gray-900">通知はまだありません。</p>
            <p className="mt-2 text-sm text-gray-500">通知が作成されるとここに履歴が表示されます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
