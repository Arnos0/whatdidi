import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { ApiErrors, createErrorResponse } from '@/lib/utils/api-errors'

export async function GET(request: NextRequest) {
  // Apply rate limiting (100 requests per minute for dashboard stats)
  const rateLimitResponse = await withRateLimit(request, 'api', 100)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { userId } = await auth()
    
    if (!userId) {
      return ApiErrors.unauthorized()
    }

    const supabase = createServerClient()
    
    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()
    
    if (userError || !user) {
      return ApiErrors.notFound('User')
    }

    // Get current month dates
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Get all orders for the user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
    
    if (ordersError) {
      return createErrorResponse(ordersError, 500, 'Failed to fetch orders')
    }

    // Calculate statistics
    const totalOrders = orders?.length || 0
    const deliveredOrders = orders?.filter(order => order.status === 'delivered').length || 0
    const totalSpent = orders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0
    
    // Current month orders
    const currentMonthOrders = orders?.filter(order => {
      const orderDate = new Date(order.order_date)
      return orderDate >= startOfMonth && orderDate <= endOfMonth
    }) || []
    
    const monthlySpent = currentMonthOrders.reduce((sum, order) => sum + Number(order.amount), 0)
    
    // Status distribution
    const statusCounts = orders?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    // Retailer distribution (top 5)
    const retailerCounts = orders?.reduce((acc, order) => {
      acc[order.retailer] = (acc[order.retailer] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    const topRetailers = Object.entries(retailerCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([retailer, count]) => ({ retailer, count }))
    
    // Recent orders (last 5)
    const recentOrders = orders
      ?.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        order_number: order.order_number,
        retailer: order.retailer,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        order_date: order.order_date,
        is_manual: order.is_manual
      })) || []

    const stats = {
      totals: {
        orders: totalOrders,
        deliveredOrders,
        totalSpent,
        monthlySpent
      },
      distributions: {
        status: statusCounts,
        topRetailers
      },
      recentOrders,
      monthInfo: {
        month: now.toLocaleDateString('en-US', { month: 'long' }),
        year: now.getFullYear()
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    return ApiErrors.serverError(error)
  }
}