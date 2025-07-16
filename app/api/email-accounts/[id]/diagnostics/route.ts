import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get email account and verify ownership
    const emailAccount = await serverEmailAccountQueries.getById(params.id, user.id)
    if (!emailAccount) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
    }

    const supabase = createServerClient()

    // Get last scan job
    const { data: lastScan } = await supabase
      .from('email_scan_jobs')
      .select('*')
      .eq('email_account_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get Coolblue emails from processed_emails
    const { data: coolblueEmails } = await supabase
      .from('processed_emails')
      .select('*')
      .eq('email_account_id', params.id)
      .or('sender.ilike.%coolblue%,subject.ilike.%coolblue%')
      .order('email_date', { ascending: false })
      .limit(10)

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('email_account_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get emails from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentEmails } = await supabase
      .from('processed_emails')
      .select('gmail_message_id, subject, sender, email_date, retailer_detected, order_created')
      .eq('email_account_id', params.id)
      .gte('email_date', sevenDaysAgo.toISOString())
      .order('email_date', { ascending: false })
      .limit(50)

    // Count emails by retailer
    const { data: retailerCounts } = await supabase
      .from('processed_emails')
      .select('retailer_detected')
      .eq('email_account_id', params.id)
      .not('retailer_detected', 'is', null)

    const retailerStats = retailerCounts?.reduce((acc, item) => {
      acc[item.retailer_detected] = (acc[item.retailer_detected] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      diagnostics: {
        lastScan: {
          id: lastScan?.id,
          status: lastScan?.status,
          created_at: lastScan?.created_at,
          completed_at: lastScan?.completed_at,
          emails_found: lastScan?.emails_found,
          emails_processed: lastScan?.emails_processed,
          orders_created: lastScan?.orders_created,
          errors_count: lastScan?.errors_count,
          last_error: lastScan?.last_error,
          date_from: lastScan?.date_from,
          date_to: lastScan?.date_to
        },
        coolblueEmails: {
          count: coolblueEmails?.length || 0,
          emails: coolblueEmails?.map(e => ({
            subject: e.subject,
            sender: e.sender,
            date: e.email_date,
            wasAnalyzed: e.retailer_detected === 'Pending AI Analysis',
            orderCreated: e.order_created,
            parseError: e.parse_error
          }))
        },
        recentOrders: {
          count: recentOrders?.length || 0,
          orders: recentOrders?.map(o => ({
            retailer: o.retailer,
            order_number: o.order_number,
            amount: o.amount,
            currency: o.currency,
            date: o.order_date
          }))
        },
        recentEmails: {
          count: recentEmails?.length || 0,
          last7Days: recentEmails?.length || 0,
          samples: recentEmails?.slice(0, 10)
        },
        retailerStats
      }
    })

  } catch (error: any) {
    console.error('Diagnostics error:', error)
    return NextResponse.json({ 
      error: 'Failed to get diagnostics',
      details: error.message 
    }, { status: 500 })
  }
}