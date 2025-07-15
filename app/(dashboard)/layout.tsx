import { LayoutWrapper } from '@/components/dashboard/layout-wrapper'
import { UserSyncProvider } from '@/components/providers/user-sync-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserSyncProvider>
      <LayoutWrapper variant="sidebar">
        {children}
      </LayoutWrapper>
    </UserSyncProvider>
  )
}