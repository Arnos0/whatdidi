'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import type { Order, OrderItem } from '@/lib/supabase/types'
import type { CreateOrderInput } from '@/lib/validation/order-form'
import type { OrderUpdateData } from '@/lib/validation/orders'
import { toast } from 'sonner'

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseOrdersOptions {
  page?: number
  limit?: number
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export function useOrders(options?: UseOrdersOptions) {
  const searchParams = useSearchParams()
  
  // Get values from URL params or options
  const page = options?.page || parseInt(searchParams.get('page') || '1')
  const limit = options?.limit || parseInt(searchParams.get('limit') || '10')
  const search = options?.search || searchParams.get('search') || ''
  const status = options?.status || searchParams.get('status') || ''
  const dateFrom = options?.dateFrom || searchParams.get('dateFrom') || ''
  const dateTo = options?.dateTo || searchParams.get('dateTo') || ''

  return useQuery<OrdersResponse>({
    queryKey: ['orders', { page, limit, search, status, dateFrom, dateTo }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

      const response = await fetch(`/api/orders?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useOrder(orderId: string) {
  return useQuery<{ order: Order & { order_items: OrderItem[] } }>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found')
        }
        throw new Error('Failed to fetch order')
      }

      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useUpdateOrder(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: OrderUpdateData) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to update order'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate both the specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order')
    },
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const formData = new FormData()
      
      // Add all fields to FormData
      formData.append('orderNumber', data.orderNumber)
      formData.append('retailer', data.retailer)
      formData.append('amount', data.amount.toString())
      formData.append('currency', data.currency)
      formData.append('status', data.status)
      formData.append('orderDate', data.orderDate.toISOString())
      
      if (data.trackingNumber) formData.append('trackingNumber', data.trackingNumber)
      if (data.carrier) formData.append('carrier', data.carrier)
      if (data.estimatedDelivery) formData.append('estimatedDelivery', data.estimatedDelivery.toISOString())
      
      // Add items as JSON
      formData.append('items', JSON.stringify(data.items))
      
      // Add receipt file if provided
      if (data.receiptFile) {
        formData.append('receiptFile', data.receiptFile)
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create order'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate orders query to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      // Also invalidate retailers to include the new one
      queryClient.invalidateQueries({ queryKey: ['retailers'] })
      toast.success('Order created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create order')
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        let errorMessage = 'Failed to delete order'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate orders query to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete order')
    },
  })
}

export function useResetOrders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (confirmation: string) => {
      const response = await fetch('/api/orders/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmation }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to reset orders'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['retailers'] })
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] })
      
      toast.success(
        `Reset complete! Deleted ${data.deleted.orders} orders and cleared all scan history.`
      )
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset orders')
    },
  })
}