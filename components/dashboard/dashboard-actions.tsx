'use client'

import { ManualOrderButton } from '@/components/orders/manual-order-button'
import { Button } from '@/components/ui/button'
import { Mail, Plus } from 'lucide-react'
import Link from 'next/link'

export function DashboardActions() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/settings">
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Connect Email
        </Button>
      </Link>
      <ManualOrderButton size="sm" />
    </div>
  )
}

export function EmptyStateActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <ManualOrderButton 
        variant="default" 
        size="lg"
        className="w-full sm:w-auto"
      />
      <Link href="/settings">
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          <Mail className="h-4 w-4 mr-2" />
          Connect Email Account
        </Button>
      </Link>
    </div>
  )
}