import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { ShoppingBag, Package, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview of your purchase tracking.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-0">
        <Card className="p-6">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-foreground">Orders</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-muted-foreground">Total orders tracked</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-foreground">Deliveries</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-muted-foreground">Packages delivered</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-foreground">Spending</h3>
              <p className="text-3xl font-bold text-purple-600">€0</p>
              <p className="text-sm text-muted-foreground">Total spent this month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card className="mx-4 sm:mx-0">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h2>
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6 text-muted-foreground" />}
            title="No orders yet"
            description="Start tracking your purchases by adding your first order or connecting your email account."
          />
        </div>
      </Card>
    </div>
  )
}