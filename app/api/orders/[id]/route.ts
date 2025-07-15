import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverOrderQueries } from '@/lib/supabase/server-queries'
import { orderIdSchema, orderUpdateSchema } from '@/lib/validation/orders'

export async function GET(
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
    const validationResult = orderIdSchema.safeParse({ id: params.id })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Get order with items
    const order = await serverOrderQueries.getByIdWithItems(params.id, user.id)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })

  } catch (error) {
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