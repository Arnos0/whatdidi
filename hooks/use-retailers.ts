'use client'

import { useQuery } from '@tanstack/react-query'
import { RETAILERS } from '@/lib/validation/order-form'

interface RetailersResponse {
  retailers: string[]
}

export function useRetailers() {
  return useQuery<RetailersResponse>({
    queryKey: ['retailers'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/retailers')
        
        if (!response.ok) {
          // If API fails, return default retailers
          return { retailers: RETAILERS.filter(r => r !== 'Other') }
        }
        
        return response.json()
      } catch (error) {
        // Fallback to default retailers on error
        // Failed to fetch retailers, using default fallback
        return { retailers: RETAILERS.filter(r => r !== 'Other') }
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  })
}