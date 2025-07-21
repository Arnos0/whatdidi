'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, MetricCard, GlassCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Package, TrendingUp, ArrowRight, ChartBarIcon, ShoppingCartIcon } from 'lucide-react'
import { RetailerIcon } from '@/components/ui/retailer-icon'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { ComponentErrorBoundary } from '@/components/ui/error-boundary'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { OrderSourceIndicator } from '@/components/orders/order-source-indicator'
import { EmptyStateActions } from './dashboard-actions'
import { formatDutchCurrency } from '@/lib/utils/currency-formatter'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { DashboardStatsSkeleton, ChartSkeleton } from '@/components/ui/skeleton'

// Dynamic imports for heavy chart components with loading states
const SpendingTrendChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => ({ default: mod.SpendingTrendChart })),
  { 
    loading: () => <div className="animate-pulse bg-muted rounded-lg h-80 w-full" />,
    ssr: false
  }
)

const RetailerDistributionChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => ({ default: mod.RetailerDistributionChart })),
  { 
    loading: () => <div className="animate-pulse bg-muted rounded-lg h-80 w-full" />,
    ssr: false
  }
)

const OrderStatusChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => ({ default: mod.OrderStatusChart })),
  { 
    loading: () => <div className="animate-pulse bg-muted rounded-lg h-80 w-full" />,
    ssr: false
  }
)

const AnimatedChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => ({ default: mod.AnimatedChart })),
  { 
    loading: () => <div className="animate-pulse bg-muted rounded-lg h-6 w-32" />,
    ssr: false
  }
)

export function DashboardContent() {
  const { data: stats, isLoading, error } = useDashboardStats()
  const prefersReducedMotion = useReducedMotion()
  
  // Animation variants that respect motion preferences
  const fadeInUp = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      }
  
  const staggerContainer = prefersReducedMotion
    ? {}
    : {
        initial: {},
        animate: { transition: { staggerChildren: 0.1 } }
      }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="px-4 sm:px-0">
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your purchase tracking.
          </p>
        </div>
        <DashboardStatsSkeleton />
      </div>
    )
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
            <MetricCard
              title="Total Orders"
              value={stats.totals.orders}
              subtitle="Orders tracked"
              icon={<ShoppingBag className="h-6 w-6 text-primary" />}
              trend={stats.totals.orders > 0 ? { value: 12.5, isPositive: true } : undefined}
            />
            
            <MetricCard
              title="Delivered"
              value={stats.totals.deliveredOrders}
              subtitle="Packages delivered"
              icon={<Package className="h-6 w-6 text-success-600" />}
              trend={stats.totals.deliveredOrders > 0 ? { value: 8.2, isPositive: true } : undefined}
            />
            
            <MetricCard
              title={`${stats.monthInfo.month} Spending`}
              value={formatDutchCurrency(stats.totals.monthlySpent)}
              subtitle="This month"
              icon={<TrendingUp className="h-6 w-6 text-warning-600" />}
              trend={stats.totals.monthlySpent > 0 ? { value: 15.3, isPositive: false } : undefined}
            />
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-0">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 font-display">Order Status</h3>
              <div className="space-y-3">
                {Object.entries(stats.distributions.status).map(([status, count], index) => (
                  <Link key={status} href={`/orders?status=${status}`} className="block">
                    <motion.div 
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center">
                        <OrderStatusBadge status={status as any} className="text-sm px-3 py-2" />
                      </div>
                      <motion.span 
                        className="font-bold text-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.2, type: "spring" }}
                      >
                        {count}
                      </motion.span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4 font-display">Top Retailers</h3>
              <div className="space-y-3">
                {stats.distributions.topRetailers.map(({ retailer, count }, index) => (
                  <motion.div 
                    key={retailer} 
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/10 transition-colors"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <RetailerIcon retailer={retailer} size="lg" />
                      </motion.div>
                      <span className="font-medium">{retailer}</span>
                    </div>
                    <Badge variant="gradient" className="bg-gradient-primary">{count} orders</Badge>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Data Visualizations */}
          <div className="space-y-6 px-4 sm:px-0">
            {/* Spending Trend Chart */}
            <ComponentErrorBoundary name="Spending Chart">
              <Suspense fallback={<div className="animate-pulse bg-muted rounded-lg h-80 w-full" />}>
                <AnimatedChart delay={0.2}>
                  <SpendingTrendChart 
                    data={[
                      { month: 'Jan', spending: 1200, orders: 8 },
                      { month: 'Feb', spending: 1800, orders: 12 },
                      { month: 'Mar', spending: 1400, orders: 10 },
                      { month: 'Apr', spending: 2200, orders: 15 },
                      { month: 'May', spending: 1900, orders: 13 },
                      { month: 'Jun', spending: 2400, orders: 18 },
                      { month: 'Jul', spending: stats.totals.monthlySpent, orders: stats.totals.orders }
                    ]}
                  />
                </AnimatedChart>
              </Suspense>
            </ComponentErrorBoundary>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ComponentErrorBoundary name="Retailer Distribution Chart">
                <Suspense fallback={<div className="animate-pulse bg-muted rounded-lg h-80 w-full" />}>
                  <AnimatedChart delay={0.4}>
                    <RetailerDistributionChart 
                      data={stats.distributions.topRetailers.map(r => ({
                        name: r.retailer,
                        value: r.count
                      }))}
                    />
                  </AnimatedChart>
                </Suspense>
              </ComponentErrorBoundary>

              <ComponentErrorBoundary name="Order Status Chart">
                <Suspense fallback={<div className="animate-pulse bg-muted rounded-lg h-80 w-full" />}>
                  <AnimatedChart delay={0.6}>
                    <OrderStatusChart 
                      data={Object.entries(stats.distributions.status).map(([status, count]) => ({
                        status: status.charAt(0).toUpperCase() + status.slice(1),
                        count
                      }))}
                    />
                  </AnimatedChart>
                </Suspense>
              </ComponentErrorBoundary>
            </div>
          </div>

          {/* Recent Orders */}
          <Card variant="gradient" className="mx-4 sm:mx-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold font-display">Recent Orders</h2>
                <Link href="/orders">
                  <Button variant="gradient" size="sm" className="group" aria-label="View all orders">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {stats.recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={`/orders/${order.id}`} className="block">
                      <Card
                        variant="interactive"
                        className="p-4 cursor-pointer group hover:border-primary/20 transition-all duration-200"
                        hover
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <motion.div 
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <RetailerIcon retailer={order.retailer} size="xl" />
                            </motion.div>
                            <div>
                              <div className="font-medium group-hover:text-primary transition-colors">
                                #{order.order_number}
                              </div>
                              <div className="text-sm text-muted-foreground">{order.retailer}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <motion.div 
                                className="font-bold text-lg"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 + 0.2, type: "spring" }}
                              >
                                {formatDutchCurrency(Number(order.amount))}
                              </motion.div>
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
                            
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <GlassCard className="mx-4 sm:mx-0 p-6">
            <h3 className="text-xl font-semibold mb-6 font-display">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: stats.totals.orders, label: "Total Orders", color: "bg-gradient-primary", icon: <ShoppingBag className="h-5 w-5 text-white" /> },
                { value: formatDutchCurrency(stats.totals.totalSpent), label: "Total Spent", color: "bg-gradient-success", icon: <TrendingUp className="h-5 w-5 text-white" /> },
                { value: stats.totals.orders > 0 ? formatDutchCurrency(stats.totals.totalSpent / stats.totals.orders) : formatDutchCurrency(0), label: "Avg per Order", color: "bg-gradient-warning", icon: <ChartBarIcon className="h-5 w-5 text-white" /> },
                { value: stats.distributions.topRetailers.length, label: "Retailers", color: "bg-gradient-danger", icon: <ShoppingCartIcon className="h-5 w-5 text-white" /> }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <motion.div
                    className={`w-16 h-16 rounded-2xl ${stat.color} mx-auto mb-3 flex items-center justify-center shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {stat.icon}
                  </motion.div>
                  <motion.div 
                    className="text-2xl font-bold font-display"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2, type: "spring" }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </>
      ) : (
        /* Empty State */
        <GlassCard className="mx-4 sm:mx-0">
          <div className="p-6">
            <div className="text-center py-12">
              <motion.div 
                className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-primary mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <ShoppingBag className="h-8 w-8 text-white" />
              </motion.div>
              <motion.h3 
                className="text-2xl font-bold font-display mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                No orders yet
              </motion.h3>
              <motion.p 
                className="text-muted-foreground mb-8 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Start tracking your purchases by adding your first order manually or connecting your email account for automatic detection.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <EmptyStateActions />
              </motion.div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="px-4 sm:px-0">
        <div className="h-5 bg-muted rounded-lg w-96 skeleton animate-shimmer"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-0">
        {[...Array(3)].map((_, i) => (
          <Card key={i} variant="gradient" className="p-6">
            <div className="space-y-3">
              <div className="h-16 w-16 bg-muted rounded-xl skeleton animate-shimmer"></div>
              <div className="h-6 bg-muted rounded-lg w-20 skeleton animate-shimmer"></div>
              <div className="h-8 bg-muted rounded-lg w-12 skeleton animate-shimmer"></div>
              <div className="h-4 bg-muted rounded-lg w-24 skeleton animate-shimmer"></div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-0">
        {[...Array(2)].map((_, i) => (
          <Card key={i} variant="glass" className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded-lg w-32 skeleton animate-shimmer"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-muted rounded-lg skeleton animate-shimmer"></div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function DashboardError() {
  return (
    <GlassCard className="mx-4 sm:mx-0 p-12">
      <div className="text-center">
        <motion.div 
          className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-danger mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <ShoppingBag className="h-8 w-8 text-white" />
        </motion.div>
        <motion.div 
          className="text-destructive mb-4 text-xl font-semibold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Failed to load dashboard data
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button 
            variant="gradient" 
            onClick={() => window.location.reload()}
            className="group"
            aria-label="Reload dashboard data"
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    </GlassCard>
  )
}