'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Plus } from 'lucide-react'
import { OrderList } from '@/components/orders/order-list'
import { OrderFilters } from '@/components/orders/order-filters'
import { Pagination } from '@/components/ui/pagination'
import { useOrders, useCreateOrder } from '@/hooks/use-orders'
import { CreateOrderDialog } from '@/components/orders/create-order-dialog'

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get('limit') || '10')
  )
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  
  const { data, isLoading, error, refetch } = useOrders()
  const createOrder = useCreateOrder()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/orders?${params.toString()}`)
  }

  const handleItemsPerPageChange = (limit: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('limit', limit.toString())
    params.set('page', '1') // Reset to first page
    setItemsPerPage(limit)
    router.push(`/orders?${params.toString()}`)
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        }
      />
      
      <div className="mx-4 sm:mx-0 space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <OrderFilters />
        </Card>

        {/* Orders List */}
        {error ? (
          <Card className="p-6">
            <div className="text-center text-destructive">
              Failed to load orders. Please try again.
            </div>
          </Card>
        ) : isLoading ? (
          <OrderList orders={[]} isLoading={true} />
        ) : data && data.orders.length > 0 ? (
          <>
            <OrderList orders={data.orders} />
            
            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <Card className="p-4">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={data.pagination.total}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </Card>
            )}
          </>
        ) : (
          <Card className="p-6">
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6 text-muted-foreground" />}
              title="No orders found"
              description="You haven't added any orders yet. Start by adding your first order manually or by connecting your email account to automatically import orders."
            />
          </Card>
        )}
      </div>

      <CreateOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateOrder={async (data) => {
          await createOrder.mutateAsync(data)
          setCreateDialogOpen(false)
        }}
        isCreating={createOrder.isPending}
      />
    </div>
  )
}