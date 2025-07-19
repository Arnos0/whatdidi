import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Orders - WhatDidiShop',
  description: 'View and manage all your tracked orders and packages in one place.',
  openGraph: {
    title: 'Orders - WhatDidiShop',
    description: 'View and manage all your tracked orders and packages in one place.',
    url: '/orders',
  },
  twitter: {
    title: 'Orders - WhatDidiShop',
    description: 'View and manage all your tracked orders and packages in one place.',
  },
}

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}