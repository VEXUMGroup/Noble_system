'use client';

import { useState } from 'react';
import type { AuthenticatedAppUser } from '@/lib/auth/access';
import { Sidebar } from '@/components/layout/Sidebar';

interface AuthenticatedShellProps {
  children: React.ReactNode;
  user: AuthenticatedAppUser;
}

export function AuthenticatedShell({
  children,
  user,
}: AuthenticatedShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="メニューを開く"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <main className="md:ml-64 flex-1 p-4 pt-16 md:p-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
