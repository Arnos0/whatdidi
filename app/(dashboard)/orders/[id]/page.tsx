'use client'

import { useRouter } from 'next/navigation'
import { OrderDetail } from '@/components/orders/order-detail'
import { useOrder, useUpdateOrder } from '@/hooks/use-orders'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const { data, isLoading, error } = useOrder(params.id)
  const updateMutation = useUpdateOrder(params.id)

  const handleBack = () => {
    router.push('/orders')
  }

  const handleUpdate = async (updates: any) => {
    await updateMutation.mutateAsync(updates)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'The order you&apos;re looking for could not be found.'}
          </p>
          <button 
            onClick={handleBack}
            className="text-primary hover:underline"
          >
            Back to Orders
          </button>
        </Card>
      </div>
    )
  }

  if (!data?.order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The order you&apos;re looking for could not be found.
          </p>
          <button 
            onClick={handleBack}
            className="text-primary hover:underline"
          >
            Back to Orders
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <OrderDetail 
        order={data.order}
        onBack={handleBack}
        onUpdate={handleUpdate}
        isUpdating={updateMutation.isPending}
      />
    </div>
  )
}