'use client'

import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Order, OrderStatus } from '@/lib/supabase/types'
import { Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'

interface OrderListProps {
  orders: Order[]
  isLoading?: boolean
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { 
    label: 'Pending', 
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />
  },
  processing: { 
    label: 'Processing', 
    variant: 'default',
    icon: <Package className="h-3 w-3" />
  },
  shipped: { 
    label: 'Shipped', 
    variant: 'default',
    icon: <Truck className="h-3 w-3" />
  },
  delivered: { 
    label: 'Delivered', 
    variant: 'outline',
    icon: <CheckCircle className="h-3 w-3" />
  },
  cancelled: { 
    label: 'Cancelled', 
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />
  }
}

export function OrderList({ orders, isLoading }: OrderListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Retailer</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Tracking</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = statusConfig[order.status as OrderStatus]
                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/50 cursor-pointer transition-colors">
                      <td className="px-6 py-4 font-medium">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4">
                        {order.retailer}
                      </td>
                      <td className="px-6 py-4">
                        {order.currency} {order.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusInfo.variant} className="gap-1">
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {new Date(order.order_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.order_date), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.tracking_number ? (
                          <div className="text-sm">
                            <div className="font-medium">{order.carrier?.toUpperCase()}</div>
                            <div className="text-xs text-muted-foreground">{order.tracking_number}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => {
          const statusInfo = statusConfig[order.status as OrderStatus]
          return (
            <Card key={order.id} className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">#{order.order_number}</div>
                    <div className="text-sm text-muted-foreground">{order.retailer}</div>
                  </div>
                  <Badge variant={statusInfo.variant} className="gap-1">
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">
                    {order.currency} {order.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(order.order_date).toLocaleDateString()}
                  </div>
                </div>

                {order.tracking_number && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{order.carrier?.toUpperCase()}</span>
                      <span className="text-muted-foreground">{order.tracking_number}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}