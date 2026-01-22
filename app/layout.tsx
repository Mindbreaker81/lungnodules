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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-slate-100 font-display">
        <ServiceWorkerRegister />
        <OfflineBanner />
        <main className="mx-auto w-full max-w-2xl px-4 py-6 pb-24 lg:max-w-4xl">{children}</main>
      </body>
    </html>
  );
}
