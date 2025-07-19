'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DashboardHeader } from '@/components/dashboard/header'
import { toast } from 'sonner'

// Dynamic imports for settings components
const EmailAccountsList = dynamic(
  () => import('@/components/settings/email-accounts-list').then(mod => ({ default: mod.EmailAccountsList })),
  { 
    loading: () => <div className="animate-pulse bg-muted rounded-lg h-48 w-full" />,
    ssr: false
  }
)

const EmailForwardingGuide = dynamic(
  () => import('@/components/settings/email-forwarding-guide').then(mod => ({ default: mod.EmailForwardingGuide })),
  { 
    loading: () => <div className="animate-pulse bg-muted rounded-lg h-32 w-full" />,
    ssr: false
  }
)

// OAuth environment configured for production
function SettingsContent() {
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
      
      <div className="mx-4 sm:mx-0 space-y-6">
        <Suspense fallback={<div className="animate-pulse bg-muted rounded-lg h-32 w-full" />}>
          <EmailForwardingGuide />
        </Suspense>
        <Suspense fallback={<div className="animate-pulse bg-muted rounded-lg h-48 w-full" />}>
          <EmailAccountsList />
        </Suspense>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  )
}