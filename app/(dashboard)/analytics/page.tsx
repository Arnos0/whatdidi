'use client'

import { DashboardHeader } from '@/components/dashboard/header'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export default function AnalyticsPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Analytics' }
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Analytics" 
        breadcrumbs={breadcrumbs}
      />
      
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-primary mb-6">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold font-display mb-3">
            Analytics Coming Soon
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Advanced analytics and insights for your purchase tracking will be available in a future update.
          </p>
        </div>
      </Card>
    </div>
  )
}