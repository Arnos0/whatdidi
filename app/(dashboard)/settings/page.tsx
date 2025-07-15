'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'
import { EmailAccountsList } from '@/components/settings/email-accounts-list'
import { toast } from 'sonner'

// OAuth environment configured for production
export default function SettingsPage() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Handle OAuth success/error messages
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const description = searchParams.get('description')
    
    if (success === 'email_connected') {
      toast.success('Email account connected successfully!')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        unauthorized: 'You need to be signed in to connect an email account',
        user_not_found: 'User account not found',
        invalid_callback: 'Invalid OAuth callback parameters',
        invalid_state: 'Invalid OAuth state - please try again',
        oauth_failed: 'Failed to connect email account',
        access_denied: 'Access denied - you cancelled the authorization'
      }
      
      toast.error(errorMessages[error] || `Connection failed: ${error}`)
    }
  }, [searchParams])

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
      
      <div className="mx-4 sm:mx-0">
        <EmailAccountsList />
      </div>
    </div>
  )
}