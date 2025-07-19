import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { createDashboardMetadata } from '@/lib/utils/metadata'

export const metadata = createDashboardMetadata({
  title: 'Dashboard',
  description: 'Get an overview of your purchase tracking, recent orders, and spending analytics.',
  path: '/dashboard',
})

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard"
        actions={<DashboardActions />}
      />
      <DashboardContent />
    </div>
  )
}