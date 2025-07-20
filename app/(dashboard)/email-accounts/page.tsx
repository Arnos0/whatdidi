'use client'

import { DashboardHeader } from '@/components/dashboard/header'
import { Card } from '@/components/ui/card'
import { Mail } from 'lucide-react'

export default function EmailAccountsPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Email Accounts' }
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Email Accounts" 
        breadcrumbs={breadcrumbs}
      />
      
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-primary mb-6">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold font-display mb-3">
            Email Accounts Coming Soon
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect your Gmail and Outlook accounts for automatic order detection. This feature will be available in Phase 2.
          </p>
        </div>
      </Card>
    </div>
  )
}