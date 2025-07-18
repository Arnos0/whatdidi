import { useQuery } from '@tanstack/react-query'

interface DashboardStats {
  totals: {
    orders: number
    deliveredOrders: number
    totalSpent: number
    monthlySpent: number
  }
  distributions: {
    status: Record<string, number>
    topRetailers: Array<{ retailer: string; count: number }>
  }
  recentOrders: Array<{
    id: string
    order_number: string
    retailer: string
    amount: number
    currency: string
    status: string
    order_date: string
    is_manual: boolean
  }>
  monthInfo: {
    month: string
    year: number
  }
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats')
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats')
  }
  
  return response.json()
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}