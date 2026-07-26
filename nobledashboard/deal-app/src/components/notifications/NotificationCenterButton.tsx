'use client';

import Link from 'next/link';

export function NotificationCenterButton({
  unreadCount = 0,
  className = '',
  onClick,
}: {
  unreadCount?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/notifications"
      onClick={onClick}
      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 ${className}`}
      aria-label="通知センターを開く"
    >
      {unreadCount > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-sm font-semibold leading-none text-white shadow-sm ring-2 ring-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    </Link>
  );
}
