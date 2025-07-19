import { createDashboardMetadata } from '@/lib/utils/metadata'

export const metadata = createDashboardMetadata({
  title: 'Orders',
  description: 'View and manage all your tracked orders and packages in one place.',
  path: '/orders',
  noIndex: true, // Private user data - don't index
})

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}