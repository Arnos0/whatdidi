'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { EmailProvider } from '@/lib/supabase/types'
import { Mail, Clock, Trash2, AlertCircle, Search } from 'lucide-react'
import { EmailScanDialog } from './email-scan-dialog'

interface EmailAccountCardProps {
  id: string
  provider: EmailProvider
  email: string
  scanEnabled: boolean
  lastScanAt: string | null
  createdAt: string
  onDisconnect: (id: string) => void
  isDisconnecting?: boolean
}

const providerConfig: Record<EmailProvider, { name: string; icon: string; color: string }> = {
  gmail: {
    name: 'Gmail',
    icon: '📧',
    color: 'text-red-600'
  },
  outlook: {
    name: 'Outlook',
    icon: '📮',
    color: 'text-blue-600'
  }
}

export function EmailAccountCard({
  id,
  provider,
  email,
  scanEnabled,
  lastScanAt,
  createdAt,
  onDisconnect,
  isDisconnecting = false
}: EmailAccountCardProps) {
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const config = providerConfig[provider]

  return (
    <>
      <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`text-2xl ${config.color}`}>
            {config.icon}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{email}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Connected via {config.name}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>
                Connected {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
              {lastScanAt && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last scanned {formatDistanceToNow(new Date(lastScanAt), { addSuffix: true })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!scanEnabled && (
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Scanning disabled</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScanDialogOpen(true)}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Scan Emails
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(id)}
            disabled={isDisconnecting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>
      </div>
    </Card>
    
    <EmailScanDialog
      accountId={id}
      email={email}
      provider={provider}
      open={scanDialogOpen}
      onOpenChange={setScanDialogOpen}
    />
    </>
  )
}