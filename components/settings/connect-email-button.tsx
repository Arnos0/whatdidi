'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { EmailProvider } from '@/lib/supabase/types'
import { Mail, Plus } from 'lucide-react'

interface ConnectEmailButtonProps {
  onConnect: (provider: EmailProvider) => void
  disabled?: boolean
}

const providers: { value: EmailProvider; label: string; description: string; icon: string }[] = [
  {
    value: 'gmail',
    label: 'Gmail',
    description: 'Connect your Gmail account',
    icon: '📧'
  },
  {
    value: 'outlook',
    label: 'Outlook',
    description: 'Connect your Outlook or Hotmail account',
    icon: '📮'
  }
]

export function ConnectEmailButton({ onConnect, disabled = false }: ConnectEmailButtonProps) {
  const [showProviders, setShowProviders] = useState(false)

  if (!showProviders) {
    return (
      <Button 
        onClick={() => setShowProviders(true)}
        disabled={disabled}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Connect Email Account
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Choose email provider</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowProviders(false)}
        >
          Cancel
        </Button>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <Card
            key={provider.value}
            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => {
              onConnect(provider.value)
              setShowProviders(false)
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{provider.icon}</span>
              <div className="space-y-1">
                <h4 className="font-medium">{provider.label}</h4>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}