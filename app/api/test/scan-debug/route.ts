import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { serverUserQueries } from '@/lib/supabase/server-queries'

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = createServerClient()
    
    // Get recent scan jobs
    const { data: scanJobs } = await supabase
      .from('email_scan_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    // Get processed emails count
    const { count: processedCount } = await supabase
      .from('processed_emails')
      .select('*', { count: 'exact', head: true })
    
    // Get recent processed emails
    const { data: recentProcessed } = await supabase
      .from('processed_emails')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Get orders created today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
    
    return NextResponse.json({
      scanJobs: scanJobs?.map(job => ({
        id: job.id,
        status: job.status,
        emails_found: job.emails_found,
        emails_processed: job.emails_processed,
        orders_created: job.orders_created,
        errors_count: job.errors_count,
        created_at: job.created_at,
        scan_type: job.scan_type,
        date_from: job.date_from
      })),
      processedEmails: {
        total: processedCount || 0,
        recent: recentProcessed?.map(email => ({
          subject: email.subject,
          sender: email.sender,
          retailer_detected: email.retailer_detected,
          order_created: email.order_created,
          created_at: email.created_at
        }))
      },
      ordersToday: todayOrders?.length || 0
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}