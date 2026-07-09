import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: '商談管理システム',
  description: '社会保険給付金サポート業務の商談管理システム',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={geistSans.className}>
        {children}
      </body>
    </html>
  );
}
