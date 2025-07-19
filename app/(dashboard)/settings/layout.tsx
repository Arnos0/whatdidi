import { createDashboardMetadata } from '@/lib/utils/metadata'

export const metadata = createDashboardMetadata({
  title: 'Settings',
  description: 'Manage your email accounts, notifications, and application preferences.',
  path: '/settings',
  noIndex: true, // Private user settings - don't index
})

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}