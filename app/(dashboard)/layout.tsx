import { LayoutWrapper } from '@/components/dashboard/layout-wrapper'
import { UserSyncProvider } from '@/components/providers/user-sync-provider'
import { PageErrorBoundary } from '@/components/ui/error-boundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserSyncProvider>
      <LayoutWrapper variant="sidebar">
        <PageErrorBoundary>
          {children}
        </PageErrorBoundary>
      </LayoutWrapper>
    </UserSyncProvider>
  )
}