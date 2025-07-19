import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { SkipNavLinks } from '@/components/ui/skip-nav'
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter'
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
    canonical: '/',
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
        <body className={inter.className}>
          <SkipNavLinks />
          <WebVitalsReporter />
          <ThemeProvider>
            <Providers>
              {children}
              <Toaster position="top-center" richColors />
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}