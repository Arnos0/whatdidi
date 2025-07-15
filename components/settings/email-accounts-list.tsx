'use client'

import { EmailAccountCard } from './email-account-card'
import { ConnectEmailButton } from './connect-email-button'
import { useEmailAccounts, useConnectEmail, useDisconnectEmail } from '@/hooks/use-email-accounts'
import { Card } from '@/components/ui/card'
import { Inbox, AlertCircle } from 'lucide-react'

export function EmailAccountsList() {
  const { data, isLoading, error } = useEmailAccounts()
  const connectMutation = useConnectEmail()
  const disconnectMutation = useDisconnectEmail()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Failed to load email accounts</p>
        </div>
      </Card>
    )
  }

  const accounts = data?.accounts || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Connected Email Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Connect your email accounts to automatically track orders from your inbox
        </p>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 rounded-full bg-muted">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">No email accounts connected</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Connect your Gmail or Outlook account to start automatically tracking orders from your emails
              </p>
            </div>
            <ConnectEmailButton 
              onConnect={connectMutation.mutate}
              disabled={connectMutation.isPending}
            />
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {accounts.map((account) => (
              <EmailAccountCard
                key={account.id}
                id={account.id}
                provider={account.provider}
                email={account.email}
                scanEnabled={account.scan_enabled}
                lastScanAt={account.last_scan_at}
                createdAt={account.created_at}
                onDisconnect={disconnectMutation.mutate}
                isDisconnecting={disconnectMutation.isPending}
              />
            ))}
          </div>
          
          <ConnectEmailButton 
            onConnect={connectMutation.mutate}
            disabled={connectMutation.isPending}
          />
        </>
      )}
    </div>
  )
}