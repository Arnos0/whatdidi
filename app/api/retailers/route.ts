import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries } from '@/lib/supabase/server-queries'
import { createServerClient } from '@/lib/supabase/server-client'
import { RETAILERS } from '@/lib/validation/order-form'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { ApiErrors } from '@/lib/utils/api-errors'

export async function GET(request: NextRequest) {
  // Apply rate limiting (50 requests per minute for retailers)
  const rateLimitResponse = await withRateLimit(request, 'api', 50)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return ApiErrors.unauthorized()
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return ApiErrors.notFound('User')
    }

    // Get unique retailers from user's orders
    const serverClient = createServerClient()
    const { data: orders, error } = await serverClient
      .from('orders')
      .select('retailer')
      .eq('user_id', user.id)
      .not('retailer', 'is', null)
    
    if (error) {
      throw error
    }

    // Extract unique retailers from orders
    const userRetailers = Array.from(new Set(orders?.map(order => order.retailer) || []))
    
    // Combine with predefined retailers and remove duplicates
    const allRetailers = Array.from(new Set([...RETAILERS, ...userRetailers]))
      .filter(retailer => retailer !== 'Other') // Remove 'Other' as it's not needed with custom input
      .sort((a, b) => {
        // Sort predefined retailers first, then alphabetically
        const aIsPredefined = RETAILERS.includes(a as any)
        const bIsPredefined = RETAILERS.includes(b as any)
        
        if (aIsPredefined && !bIsPredefined) return -1
        if (!aIsPredefined && bIsPredefined) return 1
        return a.localeCompare(b)
      })

    return NextResponse.json({ retailers: allRetailers })

  } catch (error) {
    return ApiErrors.serverError(error)
  }
}