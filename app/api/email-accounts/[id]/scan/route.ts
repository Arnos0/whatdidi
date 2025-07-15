import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { createClient } from '@/lib/supabase/server'
import { GmailService } from '@/lib/email/gmail-service'
import { registerParsers, ParserRegistry, EmailClassifier } from '@/lib/email/parsers'
import type { DateRange, ScanType } from '@/lib/types/email'

// Register all parsers on startup
registerParsers()

const scanRequestSchema = z.object({
  dateRange: z.enum(['1_month', '3_months', '6_months', '1_year', '2_years', 'all']).default('6_months'),
  scanType: z.enum(['full', 'incremental']).default('incremental')
})

export async function POST(
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

    // Parse request body
    const body = await request.json()
    const { dateRange, scanType } = scanRequestSchema.parse(body)

    // Get email account and verify ownership
    const emailAccount = await serverEmailAccountQueries.getById(params.id, user.id)
    if (!emailAccount) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
    }

    // Check if tokens are available
    if (!emailAccount.access_token || !emailAccount.refresh_token) {
      return NextResponse.json({ error: 'Email account not properly connected' }, { status: 400 })
    }

    // Create a new scan job
    const supabase = createClient()
    const { data: scanJob, error: jobError } = await supabase
      .from('email_scan_jobs')
      .insert({
        email_account_id: emailAccount.id,
        status: 'pending',
        scan_type: scanType,
        date_from: getDateFromRange(dateRange)?.toISOString(),
        date_to: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError || !scanJob) {
      return NextResponse.json({ error: 'Failed to create scan job' }, { status: 500 })
    }

    // Start the scan in the background (in a real app, this would be a queue job)
    // For now, we'll process a small batch synchronously
    processScanJob(scanJob.id, emailAccount, dateRange).catch(error => {
      console.error('Scan job failed:', error)
    })

    return NextResponse.json({
      scanJob: {
        id: scanJob.id,
        status: scanJob.status,
        created_at: scanJob.created_at
      }
    })

  } catch (error) {
    console.error('Scan initiation error:', error)
    return NextResponse.json({ error: 'Failed to start scan' }, { status: 500 })
  }
}

// Get scan job status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get latest scan job for this email account
    const supabase = createClient()
    const { data: scanJobs, error } = await supabase
      .from('email_scan_jobs')
      .select('*')
      .eq('email_account_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch scan status' }, { status: 500 })
    }

    return NextResponse.json({
      scanJob: scanJobs?.[0] || null
    })

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scan status' }, { status: 500 })
  }
}

// Helper function to get date from range
function getDateFromRange(range: DateRange): Date | null {
  const ranges: Record<DateRange, number | null> = {
    '1_month': 30 * 24 * 60 * 60 * 1000,
    '3_months': 90 * 24 * 60 * 60 * 1000,
    '6_months': 180 * 24 * 60 * 60 * 1000,
    '1_year': 365 * 24 * 60 * 60 * 1000,
    '2_years': 730 * 24 * 60 * 60 * 1000,
    'all': null
  }

  const ms = ranges[range]
  return ms ? new Date(Date.now() - ms) : null
}

// Process scan job (simplified version - in production this would be a queue job)
async function processScanJob(
  jobId: string,
  emailAccount: any,
  dateRange: DateRange
) {
  const supabase = createClient()

  try {
    // Update job status to running
    await supabase
      .from('email_scan_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Initialize Gmail service
    const gmail = new GmailService(
      emailAccount.access_token,
      emailAccount.refresh_token
    )

    // Search for order emails
    const searchResult = await gmail.searchOrderEmails(dateRange)
    const totalEmails = searchResult.messages?.length || 0

    // Update job with email count
    await supabase
      .from('email_scan_jobs')
      .update({ emails_found: totalEmails })
      .eq('id', jobId)

    // Process emails in small batches
    const batchSize = 10
    let processed = 0
    let ordersCreated = 0
    let errors = 0

    for (let i = 0; i < totalEmails; i += batchSize) {
      const batch = searchResult.messages.slice(i, i + batchSize)
      const messageIds = batch.map(m => m.id)

      // Fetch full email content
      const emails = await gmail.getMessagesBatch(messageIds)

      for (const email of emails) {
        try {
          // Check if already processed
          const { data: existing } = await supabase
            .from('processed_emails')
            .select('id')
            .eq('email_account_id', emailAccount.id)
            .eq('gmail_message_id', email.id)
            .single()

          if (existing) {
            processed++
            continue
          }

          // Classify and parse email
          const classification = EmailClassifier.classify(email)
          
          let orderId: string | null = null
          let parseError: string | null = null

          if (classification.parser) {
            try {
              const parsedOrder = await classification.parser.parse(email)
              
              if (parsedOrder && parsedOrder.confidence > 0.7) {
                // Check for duplicate order
                const { data: existingOrder } = await supabase
                  .from('orders')
                  .select('id')
                  .eq('user_id', emailAccount.user_id)
                  .eq('order_number', parsedOrder.order_number)
                  .eq('retailer', parsedOrder.retailer)
                  .single()

                if (!existingOrder) {
                  // Create new order
                  const { data: newOrder, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                      user_id: emailAccount.user_id,
                      order_number: parsedOrder.order_number,
                      retailer: parsedOrder.retailer,
                      amount: parsedOrder.amount,
                      currency: parsedOrder.currency,
                      order_date: parsedOrder.order_date,
                      estimated_delivery: parsedOrder.estimated_delivery,
                      tracking_number: parsedOrder.tracking_number,
                      carrier: parsedOrder.carrier,
                      email_account_id: emailAccount.id,
                      raw_email_data: email,
                      is_manual: false
                    })
                    .select()
                    .single()

                  if (newOrder && !orderError) {
                    orderId = newOrder.id
                    ordersCreated++

                    // Create order items if available
                    if (parsedOrder.items && parsedOrder.items.length > 0) {
                      await supabase
                        .from('order_items')
                        .insert(
                          parsedOrder.items.map(item => ({
                            order_id: newOrder.id,
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price
                          }))
                        )
                    }
                  }
                }
              }
            } catch (parseErr: any) {
              parseError = parseErr.message
              errors++
            }
          }

          // Record processed email
          const { subject, from, date } = GmailService.extractContent(email)
          await supabase
            .from('processed_emails')
            .insert({
              email_account_id: emailAccount.id,
              gmail_message_id: email.id,
              gmail_thread_id: email.threadId,
              email_date: date.toISOString(),
              subject,
              sender: from,
              retailer_detected: classification.retailer,
              order_created: !!orderId,
              order_id: orderId,
              parse_error: parseError
            })

          processed++
        } catch (error) {
          errors++
          console.error('Error processing email:', error)
        }
      }

      // Update progress
      await supabase
        .from('email_scan_jobs')
        .update({
          emails_processed: processed,
          orders_created: ordersCreated,
          errors_count: errors
        })
        .eq('id', jobId)
    }

    // Mark job as completed
    await supabase
      .from('email_scan_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        emails_processed: processed,
        orders_created: ordersCreated,
        errors_count: errors
      })
      .eq('id', jobId)

    // Update email account stats
    await supabase
      .from('email_accounts')
      .update({
        last_scan_at: new Date().toISOString(),
        total_emails_processed: emailAccount.total_emails_processed + processed,
        total_orders_created: emailAccount.total_orders_created + ordersCreated
      })
      .eq('id', emailAccount.id)

  } catch (error: any) {
    // Mark job as failed
    await supabase
      .from('email_scan_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        last_error: error.message
      })
      .eq('id', jobId)

    throw error
  }
}