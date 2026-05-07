import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '商談管理システム',
  description: '社会保険給付金サポート業務の商談管理システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
