import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries } from '@/lib/supabase/server-queries'
import { createServerClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse request body to check confirmation
    const body = await request.json()
    if (body.confirmation !== 'DELETE ALL') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type "DELETE ALL" to confirm.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Start a transaction-like operation
    console.log(`Starting order reset for user ${user.id}`)

    // 1. First, get all email account IDs for this user
    const { data: emailAccounts, error: emailAccountsError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.id)

    if (emailAccountsError) {
      console.error('Error fetching email accounts:', emailAccountsError)
      return NextResponse.json(
        { error: 'Failed to fetch email accounts' },
        { status: 500 }
      )
    }

    const emailAccountIds = emailAccounts?.map(acc => acc.id) || []

    // 2. Delete all processed emails for user's email accounts
    if (emailAccountIds.length > 0) {
      const { error: processedEmailsError, count: processedEmailsCount } = await supabase
        .from('processed_emails')
        .delete()
        .in('email_account_id', emailAccountIds)

      if (processedEmailsError) {
        console.error('Error deleting processed emails:', processedEmailsError)
        return NextResponse.json(
          { error: 'Failed to delete processed emails' },
          { status: 500 }
        )
      }
      console.log(`Deleted ${processedEmailsCount || 0} processed emails`)
    }

    // 3. Get all order IDs for this user (needed for order_items deletion)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    const orderIds = orders?.map(order => order.id) || []

    // 4. Delete all order items for user's orders
    if (orderIds.length > 0) {
      const { error: orderItemsError, count: orderItemsCount } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds)

      if (orderItemsError) {
        console.error('Error deleting order items:', orderItemsError)
        return NextResponse.json(
          { error: 'Failed to delete order items' },
          { status: 500 }
        )
      }
      console.log(`Deleted ${orderItemsCount || 0} order items`)
    }

    // 5. Delete all orders for this user
    const { error: deleteOrdersError, count: ordersCount } = await supabase
      .from('orders')
      .delete()
      .eq('user_id', user.id)

    if (deleteOrdersError) {
      console.error('Error deleting orders:', deleteOrdersError)
      return NextResponse.json(
        { error: 'Failed to delete orders' },
        { status: 500 }
      )
    }
    console.log(`Deleted ${ordersCount || 0} orders`)

    // 6. Reset email account statistics
    if (emailAccountIds.length > 0) {
      const { error: resetStatsError } = await supabase
        .from('email_accounts')
        .update({
          total_emails_processed: 0,
          total_orders_created: 0,
          last_scan_at: null
        })
        .in('id', emailAccountIds)

      if (resetStatsError) {
        console.error('Error resetting email account stats:', resetStatsError)
        // Non-critical error, continue
      }
    }

    return NextResponse.json({
      success: true,
      deleted: {
        orders: ordersCount || 0,
        orderItems: orderIds.length > 0 ? 'all' : 0,
        processedEmails: emailAccountIds.length > 0 ? 'all' : 0,
        emailAccountsReset: emailAccountIds.length
      }
    })

  } catch (error) {
    console.error('Order reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset orders' },
      { status: 500 }
    )
  }
}