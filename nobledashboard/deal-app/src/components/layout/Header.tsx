'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase';

interface HeaderProps {
  title: string;
  currentUser: {
    name: string;
    email: string;
  };
  unreadNotificationCount?: number;
  onMenuToggle?: () => void;
}

export function Header({
  title,
  currentUser,
  unreadNotificationCount,
  onMenuToggle,
}: HeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const unreadCount = useMemo(
    () => (typeof unreadNotificationCount === 'number' ? unreadNotificationCount : 0),
    [unreadNotificationCount]
  );

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 md:px-8 z-30">
      <div className="flex items-center gap-3">
        {/* モバイル用ハンバーガーメニューボタン */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="メニューを開く"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Notification Bell */}
        <div className="relative">
          <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User Avatar and Name with Dropdown */}
        <div className="relative pl-4 md:pl-6 border-l border-gray-200">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-sm hidden sm:block">
              <p className="font-medium text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="font-medium text-gray-900 text-sm">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
