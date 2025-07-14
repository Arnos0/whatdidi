import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Plus } from 'lucide-react'

export default async function OrdersPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Orders' }
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Orders" 
        breadcrumbs={breadcrumbs}
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        }
      />
      
      <Card className="mx-4 sm:mx-0">
        <div className="p-6">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6 text-muted-foreground" />}
            title="No orders found"
            description="You haven't added any orders yet. Start by adding your first order manually or by connecting your email account to automatically import orders."
          />
        </div>
      </Card>
    </div>
  )
}