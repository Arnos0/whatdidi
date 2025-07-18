import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardActions } from '@/components/dashboard/dashboard-actions'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

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