'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { OrderSourceIndicator } from '@/components/orders/order-source-indicator'
import { RetailerIcon } from '@/components/ui/retailer-icon'
import { formatDutchCurrency } from '@/lib/utils/currency-formatter'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Order, OrderStatus } from '@/lib/supabase/types'
import { Package, Truck, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'
import { useDeleteOrder } from '@/hooks/use-orders'

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
  const router = useRouter()
  const deleteOrder = useDeleteOrder()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

  const handleOrderClick = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  const handleDeleteClick = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation() // Prevent navigation to order detail
    setOrderToDelete(orderId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (orderToDelete) {
      await deleteOrder.mutateAsync(orderToDelete)
      setDeleteConfirmOpen(false)
      setOrderToDelete(null)
    }
  }

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
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Tracking</th>
                  <th className="px-6 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = statusConfig[order.status as OrderStatus]
                  return (
                    <tr 
                      key={order.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleOrderClick(order.id)}
                    >
                      <td className="px-6 py-4 font-medium">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4">
                        <RetailerIcon retailer={order.retailer} showName />
                      </td>
                      <td className="px-6 py-4">
                        {formatDutchCurrency(order.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <OrderStatusBadge status={order.status as OrderStatus} language="en" />
                      </td>
                      <td className="px-6 py-4">
                        <OrderSourceIndicator 
                          isManual={order.is_manual || false} 
                          needsReview={order.needs_review || false}
                        />
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
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteClick(e, order.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            <Card 
              key={order.id} 
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOrderClick(order.id)}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <RetailerIcon retailer={order.retailer} size="lg" />
                    <div>
                      <div className="font-medium">#{order.order_number}</div>
                      <div className="text-sm text-muted-foreground">{order.retailer}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderSourceIndicator 
                      isManual={order.is_manual || false} 
                      needsReview={order.needs_review || false}
                      className="text-xs"
                    />
                    <OrderStatusBadge status={order.status as OrderStatus} language="en" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(e, order.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">
                    {formatDutchCurrency(order.amount)}
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

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}