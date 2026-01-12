import './globals.css';
import type { ReactNode } from 'react';
import { ServiceWorkerRegister } from '@components/ServiceWorkerRegister';
import { OfflineBanner } from '@components/OfflineBanner';

export const metadata = {
  title: 'Lung Nodule Decision Support',
  description: 'Fleischner 2017 / Lung-RADS v2022 follow-up guidance',
  manifest: '/manifest.json',
  themeColor: '#1E40AF',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-slate-900">
        <ServiceWorkerRegister />
        <OfflineBanner />
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
