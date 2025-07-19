import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - WhatDidiShop',
  description: 'Get an overview of your purchase tracking, recent orders, and spending analytics.',
  openGraph: {
    title: 'Dashboard - WhatDidiShop',
    description: 'Get an overview of your purchase tracking, recent orders, and spending analytics.',
    url: '/dashboard',
  },
  twitter: {
    title: 'Dashboard - WhatDidiShop',
    description: 'Get an overview of your purchase tracking, recent orders, and spending analytics.',
  },
}

export default function DashboardPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}