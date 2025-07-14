import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverOrderQueries, serverOrderItemQueries } from '@/lib/supabase/server-queries'
import type { OrderInsert, OrderItemInsert } from '@/lib/supabase/types'

// Sample data for testing
const retailers = ['Bol.com', 'Coolblue', 'Zalando', 'Amazon', 'MediaMarkt']
const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const carriers = ['postnl', 'dhl', 'dpd']

function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

function generateTrackingNumber() {
  return `TRK${Math.random().toString(36).substr(2, 12).toUpperCase()}`
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export async function POST() {
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

    // Generate 20 sample orders
    const orders = []
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3) // 3 months ago

    for (let i = 0; i < 20; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const hasTracking = ['shipped', 'delivered'].includes(status)
      const orderDate = randomDate(startDate, endDate)
      
      const order: OrderInsert = {
        user_id: user.id,
        order_number: generateOrderNumber(),
        retailer: retailers[Math.floor(Math.random() * retailers.length)],
        amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
        currency: 'EUR',
        status,
        tracking_number: hasTracking ? generateTrackingNumber() : null,
        carrier: hasTracking ? carriers[Math.floor(Math.random() * carriers.length)] : null,
        order_date: orderDate.toISOString().split('T')[0],
        estimated_delivery: hasTracking 
          ? new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
          : null,
        is_manual: true
      }

      const createdOrder = await serverOrderQueries.create(order)
      
      if (createdOrder) {
        orders.push(createdOrder)
        
        // Create 1-3 items for each order
        const itemCount = Math.floor(Math.random() * 3) + 1
        const items: OrderItemInsert[] = []
        
        for (let j = 0; j < itemCount; j++) {
          items.push({
            order_id: createdOrder.id,
            description: `Sample Product ${j + 1}`,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: parseFloat((Math.random() * 200 + 5).toFixed(2)),
          })
        }
        
        await serverOrderItemQueries.createMany(items)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${orders.length} sample orders`,
      orders
    })

  } catch (error) {
    console.error('Test data creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create test data' },
      { status: 500 }
    )
  }
}