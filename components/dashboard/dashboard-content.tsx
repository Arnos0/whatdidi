'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Package, TrendingUp, Eye, ArrowRight } from 'lucide-react'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { OrderSourceIndicator } from '@/components/orders/order-source-indicator'
import { EmptyStateActions } from './dashboard-actions'
import { formatDutchCurrency } from '@/lib/utils/currency-formatter'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export function DashboardContent() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return <DashboardError />
  }

  const hasOrders = stats && stats.totals.orders > 0

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="px-4 sm:px-0">
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your purchase tracking.
        </p>
      </div>

      {hasOrders ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-0">
            <StatCard
              title="Total Orders"
              value={stats.totals.orders}
              subtitle="Orders tracked"
              icon={<ShoppingBag className="h-8 w-8 text-blue-600" />}
              valueColor="text-blue-600"
            />
            
            <StatCard
              title="Delivered"
              value={stats.totals.deliveredOrders}
              subtitle="Packages delivered"
              icon={<Package className="h-8 w-8 text-green-600" />}
              valueColor="text-green-600"
            />
            
            <StatCard
              title={`${stats.monthInfo.month} Spending`}
              value={formatDutchCurrency(stats.totals.monthlySpent)}
              subtitle="This month"
              icon={<TrendingUp className="h-8 w-8 text-purple-600" />}
              valueColor="text-purple-600"
            />
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-0">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Order Status</h3>
              <div className="space-y-3">
                {Object.entries(stats.distributions.status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <OrderStatusBadge status={status as any} />
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Retailers</h3>
              <div className="space-y-3">
                {stats.distributions.topRetailers.map(({ retailer, count }) => (
                  <div key={retailer} className="flex items-center justify-between">
                    <span className="font-medium">{retailer}</span>
                    <Badge variant="secondary">{count} orders</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="mx-4 sm:mx-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Link href="/orders">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">#{order.order_number}</div>
                        <div className="text-sm text-muted-foreground">{order.retailer}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{formatDutchCurrency(Number(order.amount))}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.order_date), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <OrderSourceIndicator 
                          isManual={order.is_manual || false} 
                          className="text-xs"
                        />
                        <OrderStatusBadge status={order.status as any} />
                      </div>
                      
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="mx-4 sm:mx-0 p-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totals.orders}</div>
                <div className="text-sm text-muted-foreground">Total Orders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{formatDutchCurrency(stats.totals.totalSpent)}</div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totals.orders > 0 ? formatDutchCurrency(stats.totals.totalSpent / stats.totals.orders) : formatDutchCurrency(0)}
                </div>
                <div className="text-sm text-muted-foreground">Avg per Order</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.distributions.topRetailers.length}
                </div>
                <div className="text-sm text-muted-foreground">Retailers</div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        /* Empty State */
        <Card className="mx-4 sm:mx-0">
          <div className="p-6">
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start tracking your purchases by adding your first order manually or connecting your email account for automatic detection.
              </p>
              <EmptyStateActions />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  valueColor = "text-foreground" 
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  valueColor?: string
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center">
        {icon}
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-0">
        <div className="h-5 bg-muted rounded w-96 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-0">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-muted rounded w-8"></div>
              <div className="h-6 bg-muted rounded w-20"></div>
              <div className="h-8 bg-muted rounded w-12"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="mx-4 sm:mx-0 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-32"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function DashboardError() {
  return (
    <Card className="mx-4 sm:mx-0 p-6">
      <div className="text-center">
        <div className="text-destructive mb-2">Failed to load dashboard data</div>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    </Card>
  )
}