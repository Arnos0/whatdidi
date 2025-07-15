'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderEditForm } from './order-edit-form'
import type { Order, OrderItem, OrderStatus } from '@/lib/supabase/types'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit2, 
  Save, 
  X,
  Receipt,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Calendar
} from 'lucide-react'

interface OrderDetailProps {
  order: Order & { order_items: OrderItem[] }
  onBack?: () => void
  onUpdate?: (updates: any) => Promise<void>
  isUpdating?: boolean
}

const statusConfig: Record<OrderStatus, { 
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: React.ReactNode 
  color: string
}> = {
  pending: { 
    label: 'Pending', 
    variant: 'secondary',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-yellow-600'
  },
  processing: { 
    label: 'Processing', 
    variant: 'default',
    icon: <Package className="h-4 w-4" />,
    color: 'text-blue-600'
  },
  shipped: { 
    label: 'Shipped', 
    variant: 'default',
    icon: <Truck className="h-4 w-4" />,
    color: 'text-purple-600'
  },
  delivered: { 
    label: 'Delivered', 
    variant: 'outline',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600'
  },
  cancelled: { 
    label: 'Cancelled', 
    variant: 'destructive',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600'
  }
}

export function OrderDetail({ order, onBack, onUpdate, isUpdating = false }: OrderDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const statusInfo = statusConfig[order.status as OrderStatus]

  const handleSave = async (updates: any) => {
    if (onUpdate) {
      await onUpdate(updates)
    }
    setIsEditing(false)
  }

  const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0)
  const itemsTotal = order.order_items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              Placed {formatDistanceToNow(new Date(order.order_date), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={statusInfo.variant} className="gap-2">
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
          
          {onUpdate && (
            <Button
              variant={isEditing ? "outline" : "default"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Edit Form */}
          {isEditing && onUpdate && (
            <OrderEditForm
              order={order}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isLoading={isUpdating}
            />
          )}
          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Retailer</label>
                <p className="text-sm">{order.retailer}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                <p className="text-lg font-semibold">{order.currency} {order.amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(order.order_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Items</label>
                <p className="text-sm">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            {order.order_items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items found for this order.</p>
            ) : (
              <div className="space-y-4">
                {order.order_items.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between items-start p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.description}</h3>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.currency} {(item.price || 0).toFixed(2)}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          {order.currency} {((item.price || 0) * item.quantity).toFixed(2)} total
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items Subtotal</span>
                    <span>{order.currency} {itemsTotal.toFixed(2)}</span>
                  </div>
                  {order.amount !== itemsTotal && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping & Other</span>
                      <span>{order.currency} {(order.amount - itemsTotal).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{order.currency} {order.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery Information
            </h3>
            
            {order.tracking_number ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Carrier</label>
                  <p className="text-sm font-medium">{order.carrier?.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{order.tracking_number}</code>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {order.estimated_delivery && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estimated Delivery</label>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {new Date(order.estimated_delivery).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tracking information available</p>
            )}
          </Card>

          {/* Order Timeline */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Order Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${statusInfo.color} bg-current/10`}>
                  {statusInfo.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{statusInfo.label}</p>
                  <p className="text-sm text-muted-foreground">
                    Current status
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full text-blue-600 bg-blue-600/10">
                  <Package className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Receipt */}
          {order.receipt_url && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Receipt
              </h3>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => window.open(order.receipt_url!, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View Receipt
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}