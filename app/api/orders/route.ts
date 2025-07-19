import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverOrderQueries, serverOrderItemQueries } from '@/lib/supabase/server-queries'
import { orderQuerySchema } from '@/lib/validation/orders'
import { createOrderSchema } from '@/lib/validation/order-form'
import { createServerClient } from '@/lib/supabase/server-client'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { ApiErrors, createErrorResponse } from '@/lib/utils/api-errors'

export async function GET(request: NextRequest) {
  // Apply rate limiting (200 requests per minute for orders API)
  const rateLimitResponse = await withRateLimit(request, 'api', 200)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return ApiErrors.unauthorized()
    }

    // Debug logging (removed sensitive data)

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    
    if (!user) {
      return ApiErrors.notFound('User')
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    }

    // Validate parameters
    const validationResult = orderQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return ApiErrors.badRequest('Invalid query parameters')
    }

    const { page, limit, search, status, dateFrom, dateTo } = validationResult.data

    // Calculate offset
    const offset = (page - 1) * limit

    // Get orders with all filters applied at database level
    const { orders, total } = await serverOrderQueries.getByUserIdWithFilters(user.id, {
      status,
      search,
      dateFrom,
      dateTo,
      limit,
      offset
    })

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    return ApiErrors.serverError(error)
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting (50 requests per minute for order creation)
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

    // Parse form data (includes file)
    const formData = await request.formData()
    
    // Extract order data from form
    const orderData = {
      orderNumber: formData.get('orderNumber') as string,
      retailer: formData.get('retailer') as string,
      amount: Number(formData.get('amount')),
      currency: formData.get('currency') as string || 'EUR',
      status: formData.get('status') as string || 'pending',
      orderDate: new Date(formData.get('orderDate') as string),
      trackingNumber: formData.get('trackingNumber') || undefined,
      carrier: formData.get('carrier') || undefined,
      estimatedDelivery: formData.get('estimatedDelivery') ? new Date(formData.get('estimatedDelivery') as string) : undefined,
      items: JSON.parse(formData.get('items') as string || '[]'),
      receiptFile: formData.get('receiptFile') as File || undefined
    }

    // Validate order data
    const validationResult = createOrderSchema.safeParse(orderData)
    if (!validationResult.success) {
      return ApiErrors.badRequest('Invalid order data')
    }

    const validatedData = validationResult.data
    let receiptUrl: string | null = null

    // Handle file upload if provided
    if (validatedData.receiptFile) {
      const supabase = createServerClient()
      
      // Generate unique file name with security
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf']
      const fileExt = validatedData.receiptFile.name.split('.').pop()?.toLowerCase() || ''
      
      if (!allowedExtensions.includes(fileExt)) {
        return ApiErrors.badRequest('Invalid file type. Allowed types: ' + allowedExtensions.join(', '))
      }
      
      // Sanitize filename - only use generated name, not user input
      const safeFileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(safeFileName, validatedData.receiptFile, {
          contentType: validatedData.receiptFile.type,
          cacheControl: '3600'
        })

      if (uploadError) {
        return createErrorResponse(uploadError, 500, 'Failed to upload receipt')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(safeFileName)
      
      receiptUrl = publicUrl
    }

    // Create order
    const order = await serverOrderQueries.create({
      user_id: user.id,
      order_number: validatedData.orderNumber,
      retailer: validatedData.retailer,
      amount: validatedData.amount,
      currency: validatedData.currency,
      status: validatedData.status,
      order_date: validatedData.orderDate.toISOString(),
      tracking_number: validatedData.trackingNumber,
      carrier: validatedData.carrier,
      estimated_delivery: validatedData.estimatedDelivery?.toISOString(),
      is_manual: true,
      receipt_url: receiptUrl
    })

    if (!order) {
      return createErrorResponse('Order creation failed', 500, 'Failed to create order')
    }

    // Create order items
    if (validatedData.items.length > 0) {
      const orderItems = validatedData.items.map(item => ({
        order_id: order.id,
        description: item.description,
        quantity: item.quantity,
        price: item.price
      }))

      await serverOrderItemQueries.createMany(orderItems)
    }

    return NextResponse.json({ order }, { status: 201 })

  } catch (error) {
    return ApiErrors.serverError(error)
  }
}