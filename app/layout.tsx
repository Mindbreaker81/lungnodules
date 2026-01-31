import './globals.css';
import type { ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import { ServiceWorkerRegister } from '@components/ServiceWorkerRegister';
import { OfflineBanner } from '@components/OfflineBanner';
import LegalFooter from '@components/LegalFooter';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});


export const metadata = {
  title: 'Lung Nodule Decision Support',
  description: 'Fleischner 2017 / Lung-RADS v2022 follow-up guidance',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#1E40AF',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.className} min-h-screen bg-background text-slate-100 font-display`}>
        <ServiceWorkerRegister />
        <OfflineBanner />
        <main className="mx-auto w-full max-w-2xl px-4 py-6 pb-24 lg:max-w-4xl">{children}</main>
        <LegalFooter />
      </body>
    </html>
  );
}
