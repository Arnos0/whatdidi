import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverOrderQueries } from '@/lib/supabase/server-queries'
import { orderIdSchema, orderUpdateSchema } from '@/lib/validation/orders'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let user: any = null
  let clerkId: string | null = null
  
  try {
    console.log('🔍 Order Detail API Debug:', {
      orderId: params.id,
      timestamp: new Date().toISOString()
    })

    // Check authentication
    const authResult = await auth()
    clerkId = authResult.userId
    if (!clerkId) {
      console.log('❌ Order Detail API: No Clerk ID found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ Order Detail API: Clerk ID found:', clerkId)

    // Get user from database
    user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      console.log('❌ Order Detail API: User not found in database for Clerk ID:', clerkId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ Order Detail API: Database user found:', {
      userId: user.id,
      email: user.email
    })

    // Validate order ID
    const validationResult = orderIdSchema.safeParse({ id: params.id })
    if (!validationResult.success) {
      console.log('❌ Order Detail API: Invalid order ID format:', params.id)
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    console.log('✅ Order Detail API: Order ID validation passed')

    // Get order with items
    console.log('🔍 Order Detail API: Querying order with ID:', params.id, 'for user:', user.id)
    const order = await serverOrderQueries.getByIdWithItems(params.id, user.id)
    
    if (!order) {
      console.log('❌ Order Detail API: Order not found or no access:', {
        orderId: params.id,
        userId: user.id
      })
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('✅ Order Detail API: Order found:', {
      orderId: order.id,
      orderNumber: order.order_number,
      retailer: order.retailer,
      itemsCount: order.order_items?.length || 0
    })

    return NextResponse.json({ order })

  } catch (error) {
    console.error('🔍 Order Detail API Error:', {
      orderId: params.id,
      userId: user?.id,
      clerkId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate order ID
    const idValidation = orderIdSchema.safeParse({ id: params.id })
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Parse and validate update data
    const body = await request.json()
    const validationResult = orderUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid update data' },
        { status: 400 }
      )
    }

    // Convert estimated_delivery to ISO string if provided
    const updates = { ...validationResult.data }
    if (updates.estimated_delivery) {
      updates.estimated_delivery = new Date(updates.estimated_delivery).toISOString()
    }

    // Update order
    const updatedOrder = await serverOrderQueries.updateById(params.id, user.id, updates)
    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order: updatedOrder })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate order ID
    const idValidation = orderIdSchema.safeParse({ id: params.id })
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Delete order items first (due to foreign key constraint)
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', params.id)

    // Delete the order
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Order deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}