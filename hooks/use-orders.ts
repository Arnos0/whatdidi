'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import type { Order } from '@/lib/supabase/types'

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