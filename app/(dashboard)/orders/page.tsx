'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ShoppingBag, Plus, AlertTriangle } from 'lucide-react'
import { OrderList } from '@/components/orders/order-list'
import { OrderFilters } from '@/components/orders/order-filters'
import { Pagination } from '@/components/ui/pagination'
import { useOrders, useCreateOrder, useResetOrders } from '@/hooks/use-orders'
import { CreateOrderDialog } from '@/components/orders/create-order-dialog'
import { ManualOrderButton } from '@/components/orders/manual-order-button'

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get('limit') || '10')
  )
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  
  const { data, isLoading, error, refetch } = useOrders()
  const createOrder = useCreateOrder()
  const resetOrders = useResetOrders()
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development'

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

  const handleReset = async () => {
    if (resetConfirmation === 'DELETE ALL') {
      await resetOrders.mutateAsync(resetConfirmation)
      setResetDialogOpen(false)
      setResetConfirmation('')
    }
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
          <div className="flex gap-2">
            {isDevelopment && (
              <Button 
                onClick={() => setResetDialogOpen(true)}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reset All Orders
              </Button>
            )}
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Order
            </Button>
            <ManualOrderButton variant="outline" size="sm" />
          </div>
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

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Reset All Orders - Development Only
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will permanently delete ALL your orders and clear your email scan history.
                This action cannot be undone.
              </p>
              <p className="font-semibold">
                This includes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All orders and order items</li>
                <li>All processed email history</li>
                <li>Email account scan statistics</li>
              </ul>
              <div className="pt-4">
                <p className="text-sm font-medium mb-2">
                  To confirm, type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">DELETE ALL</span> below:
                </p>
                <Input
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="Type DELETE ALL to confirm"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetConfirmation('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={resetConfirmation !== 'DELETE ALL' || resetOrders.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {resetOrders.isPending ? 'Resetting...' : 'Reset Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersContent />
    </Suspense>
  )
}