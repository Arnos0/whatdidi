'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import Link from 'next/link'
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
import { Package, Truck, CheckCircle, XCircle, Clock, Trash2, ArrowRight } from 'lucide-react'
import { useDeleteOrder } from '@/hooks/use-orders'
import { OrderCardSkeleton } from '@/components/ui/skeleton'
import { ComponentErrorBoundary } from '@/components/ui/error-boundary'

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
  const deleteOrder = useDeleteOrder()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

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
    return <OrderCardSkeleton />
  }

  if (orders.length === 0) {
    return null
  }

  return (
    <ComponentErrorBoundary name="Order List">
      <div className="space-y-4">

      {/* Card View - Dashboard Recent Orders Style */}
      <div className="space-y-4">
        {orders.map((order, index) => (
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
                        {formatDutchCurrency(order.amount)}
                      </motion.div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.order_date), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <OrderSourceIndicator 
                        isManual={order.is_manual || false} 
                        needsReview={order.needs_review || false}
                        className="text-xs"
                      />
                      <OrderStatusBadge status={order.status as OrderStatus} language="en" />
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
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
    </ComponentErrorBoundary>
  )
}