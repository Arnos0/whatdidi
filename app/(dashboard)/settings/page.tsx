import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Settings' }
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Settings" 
        breadcrumbs={breadcrumbs}
      />
      
      <Card className="mx-4 sm:mx-0">
        <div className="p-6">
          <EmptyState
            icon={<Settings className="h-6 w-6 text-muted-foreground" />}
            title="Settings coming soon"
            description="User settings, email account management, and preferences will be available here soon."
          />
        </div>
      </Card>
    </div>
  )
}