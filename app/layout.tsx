import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { SkipNavLinks } from '@/components/ui/skip-nav'
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { NetworkStatus } from '@/components/ui/network-status'
import { TestingPanel } from '@/components/debug/testing-panel'
import { ServiceWorkerProvider } from '@/components/providers/service-worker-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WhatDidiShop - Track Your Online Purchases',
  description: 'Never lose track of what you bought. Automatically track all your online purchases and deliveries in one place.',
  keywords: ['order tracking', 'purchase tracking', 'delivery tracking', 'online shopping', 'e-commerce', 'package tracking'],
  authors: [{ name: 'WhatDidiShop' }],
  creator: 'WhatDidiShop',
  publisher: 'WhatDidiShop',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://whatdidishop.com'),
  alternates: {
    canonical: 'https://whatdidishop.com/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://whatdidishop.com',
    title: 'WhatDidiShop - Track Your Online Purchases',
    description: 'Never lose track of what you bought. Automatically track all your online purchases and deliveries in one place.',
    siteName: 'WhatDidiShop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatDidiShop - Track Your Online Purchases',
    description: 'Never lose track of what you bought. Automatically track all your online purchases and deliveries in one place.',
    creator: '@whatdidishop',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#4f46e5" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="WhatDidiShop" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
        </head>
        <body className={inter.className}>
          <SkipNavLinks />
          <WebVitalsReporter />
          <ServiceWorkerProvider />
          <ThemeProvider>
            <ErrorBoundary>
              <Providers>
                {children}
                <NetworkStatus />
                <TestingPanel />
                <Toaster position="top-center" richColors />
              </Providers>
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}