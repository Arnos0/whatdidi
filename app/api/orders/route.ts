import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverOrderQueries, serverOrderItemQueries } from '@/lib/supabase/server-queries'
import { orderQuerySchema } from '@/lib/validation/orders'
import { createOrderSchema } from '@/lib/validation/order-form'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Debug logging
    console.log('🔍 Orders API Debug:')
    console.log(`  Clerk ID: ${clerkId}`)

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    console.log(`  Database User: ${user ? `${user.id} (${user.email})` : 'NOT FOUND'}`)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { page, limit, search, status, dateFrom, dateTo } = validationResult.data

    // Calculate offset
    const offset = (page - 1) * limit

    // Get orders with all filters applied at database level
    console.log(`  Querying orders for user ID: ${user.id}`)
    const { orders, total } = await serverOrderQueries.getByUserIdWithFilters(user.id, {
      status,
      search,
      dateFrom,
      dateTo,
      limit,
      offset
    })

    console.log(`  Found ${orders?.length || 0} orders (total: ${total})`)

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
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
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
        return NextResponse.json(
          { error: 'Invalid file type' },
          { status: 400 }
        )
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
        return NextResponse.json(
          { error: 'Failed to upload receipt' },
          { status: 500 }
        )
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
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
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
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}