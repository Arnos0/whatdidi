import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { createServerClient } from '@/lib/supabase/server-client'
import { GmailService } from '@/lib/email/gmail-service'
import { AIEmailClassifier } from '@/lib/email/ai-parser'
import { ClaudeService, claudeService } from '@/lib/ai/claude-service'
import type { DateRange, ScanType } from '@/lib/types/email'

const scanRequestSchema = z.object({
  dateRange: z.enum(['1_week', '2_weeks', '1_month', '3_months', '6_months']).default('1_month'),
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
    const supabase = createServerClient()
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
    // For now, we'll process synchronously to ensure it completes
    processScanJob(scanJob.id, emailAccount, dateRange, scanType).catch(async error => {
      console.error('Scan job failed:', error)
      // Mark job as failed
      await supabase
        .from('email_scan_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          last_error: `Fatal error: ${error.message}`
        })
        .eq('id', scanJob.id)
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
    const supabase = createServerClient()
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
    '1_week': 7 * 24 * 60 * 60 * 1000,
    '2_weeks': 14 * 24 * 60 * 60 * 1000,
    '1_month': 30 * 24 * 60 * 60 * 1000,
    '3_months': 90 * 24 * 60 * 60 * 1000,
    '6_months': 180 * 24 * 60 * 60 * 1000
  }

  const ms = ranges[range]
  return ms ? new Date(Date.now() - ms) : null
}

// Process scan job (simplified version - in production this would be a queue job)
async function processScanJob(
  jobId: string,
  emailAccount: any,
  dateRange: DateRange,
  scanType: ScanType
) {
  const supabase = createServerClient()

  try {
    // Check if AI API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.')
    }
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

    console.log(`Scan job ${jobId}: Found ${totalEmails} emails (estimated: ${searchResult.resultSizeEstimate})`)

    // Update job with email count
    await supabase
      .from('email_scan_jobs')
      .update({ emails_found: totalEmails })
      .eq('id', jobId)

    // Process emails in smaller batches for better progress visibility
    const batchSize = 10 // Smaller batches = more frequent progress updates
    let processed = 0
    let ordersCreated = 0
    let errors = 0
    let skipped = 0
    let aiAnalysisCount = 0 // Track API usage for cost monitoring
    const scanStartTime = Date.now()

    // Check scan type to determine if we should skip already processed emails
    let messagesToProcess = searchResult.messages
    
    if (scanType === 'incremental') {
      // For incremental scan: Skip already processed emails
      console.log('Incremental scan: Checking for already processed emails...')
      const { data: processedEmailIds } = await supabase
        .from('processed_emails')
        .select('gmail_message_id')
        .eq('email_account_id', emailAccount.id)
      
      const processedSet = new Set(processedEmailIds?.map(e => e.gmail_message_id) || [])
      console.log(`Found ${processedSet.size} already processed emails`)

      // Filter out already processed emails
      messagesToProcess = searchResult.messages.filter(m => !processedSet.has(m.id))
      console.log(`Incremental scan: Processing ${messagesToProcess.length} new emails (skipping ${searchResult.messages.length - messagesToProcess.length} already processed)`)
    } else {
      // For full scan: Process ALL emails, including previously processed ones
      console.log(`Full scan: Processing ALL ${messagesToProcess.length} emails (not skipping any)`)
    }

    for (let i = 0; i < messagesToProcess.length; i += batchSize) {
      const batch = messagesToProcess.slice(i, i + batchSize)
      const messageIds = batch.map(m => m.id)

      // Fetch full email content
      const emails = await gmail.getMessagesBatch(messageIds)
      
      // First, filter emails that need AI analysis
      const emailsToAnalyze: typeof emails = []
      const emailsToSkip: typeof emails = []
      
      for (const email of emails) {
        const classification = AIEmailClassifier.classify(email)
        if (classification.parser) {
          emailsToAnalyze.push(email)
        } else {
          emailsToSkip.push(email)
        }
      }
      
      console.log(`Batch: ${emailsToAnalyze.length} emails for AI analysis, ${emailsToSkip.length} skipped`)
      
      // Process AI emails in smaller groups to avoid overwhelming the system
      const aiResults = new Map<string, any>()
      if (emailsToAnalyze.length > 0) {
        const aiStartTime = Date.now()
        
        try {
          // Prepare emails for batch analysis
          const emailsForAI = emailsToAnalyze.map(email => {
            const { subject, from, date, htmlBody, textBody } = GmailService.extractContent(email)
            return {
              id: email.id,
              subject,
              from,
              date,
              body: (htmlBody || textBody || '').substring(0, 5000) // Reduced to 5000 chars
            }
          })
          
          // Use batch analysis with error handling
          const batchResults = await claudeService.batchAnalyzeEmails(emailsForAI)
          
          // Process results
          for (const email of emailsToAnalyze) {
            const result = batchResults.get(email.id)
            if (result && result.isOrder && result.orderData) {
              aiResults.set(email.id, {
                ...result.orderData,
                confidence: result.orderData.confidence || 0.5
              })
            }
          }
          
          aiAnalysisCount += emailsToAnalyze.length
          const aiElapsed = Date.now() - aiStartTime
          console.log(`AI batch analysis completed in ${aiElapsed}ms for ${emailsToAnalyze.length} emails`)
        } catch (aiError: any) {
          console.error(`AI batch analysis failed:`, aiError.message)
          errors += emailsToAnalyze.length
          // Continue processing even if AI fails
        }
      }
      
      // Now process all emails with results
      for (const email of emails) {
        try {
          let orderId: string | null = null
          let parseError: string | null = null
          
          const parsedOrder = aiResults.get(email.id)
          
          if (parsedOrder) {
            console.log(`AI found order: ${parsedOrder.retailer} - ${parsedOrder.order_number}`)
            
            if (parsedOrder && parsedOrder.confidence > 0.7) {
              let existingOrder = null
                
                // For DHL tracking emails, try to find order by tracking number
                if (parsedOrder.retailer === 'DHL Tracking' && parsedOrder.tracking_number) {
                  const { data } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('user_id', emailAccount.user_id)
                    .eq('tracking_number', parsedOrder.tracking_number)
                    .single()
                  existingOrder = data
                  
                  // If found, update the order status
                  if (existingOrder) {
                    await supabase
                      .from('orders')
                      .update({
                        status: parsedOrder.status,
                        estimated_delivery: parsedOrder.estimated_delivery,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', existingOrder.id)
                    
                    orderId = existingOrder.id
                    console.log(`Updated existing order ${existingOrder.id} with DHL tracking status`)
                  }
                } else if (parsedOrder.order_number) {
                  // For regular orders, check by order number and retailer
                  const { data } = await supabase
                    .from('orders')
                    .select('id, status, tracking_number')
                    .eq('user_id', emailAccount.user_id)
                    .eq('order_number', parsedOrder.order_number)
                    .eq('retailer', parsedOrder.retailer)
                    .single()
                  existingOrder = data
                  
                  // If found, update with new information
                  if (existingOrder) {
                    const updates: any = {}
                    
                    // Update status if new status is "higher" in the flow
                    const statusOrder = ['confirmed', 'shipped', 'delivered']
                    const currentIndex = statusOrder.indexOf(existingOrder.status || 'confirmed')
                    const newIndex = statusOrder.indexOf(parsedOrder.status || 'confirmed')
                    if (newIndex > currentIndex) {
                      updates.status = parsedOrder.status
                    }
                    
                    // Update tracking if not already set
                    if (parsedOrder.tracking_number && !existingOrder.tracking_number) {
                      updates.tracking_number = parsedOrder.tracking_number
                      updates.carrier = parsedOrder.carrier
                    }
                    
                    // Update delivery date if provided
                    if (parsedOrder.estimated_delivery) {
                      updates.estimated_delivery = parsedOrder.estimated_delivery
                    }
                    
                    if (Object.keys(updates).length > 0) {
                      updates.updated_at = new Date().toISOString()
                      await supabase
                        .from('orders')
                        .update(updates)
                        .eq('id', existingOrder.id)
                      
                      console.log(`Updated existing order ${existingOrder.id} with new information`)
                    }
                    
                    orderId = existingOrder.id
                  }
                }

                if (!existingOrder) {
                  // Only create order if we have essential data
                  if (!parsedOrder.order_number || !parsedOrder.amount || parsedOrder.amount <= 0) {
                    console.log(`Skipping order creation - missing data: order_number=${parsedOrder.order_number}, amount=${parsedOrder.amount}`)
                    parseError = 'Missing essential order data'
                  } else {
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
                        status: parsedOrder.status || 'pending',
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
                      console.log(`Created order ${newOrder.id} for ${parsedOrder.retailer} - ${parsedOrder.currency} ${parsedOrder.amount}`)

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
                    } else if (orderError) {
                      console.error('Failed to create order:', orderError)
                      parseError = orderError.message
                    }
                  }
                }
              } else {
                console.log(`Low confidence order skipped: ${parsedOrder.retailer} - confidence: ${parsedOrder.confidence}`)
              }
            } else {
              console.log(`Email not detected as order: ${email.id}`)
            }

          // Record processed email
          const { subject, from, date } = GmailService.extractContent(email)
          
          if (scanType === 'full') {
            // For full scan: Update existing record or insert new
            await supabase
              .from('processed_emails')
              .upsert({
                email_account_id: emailAccount.id,
                gmail_message_id: email.id,
                gmail_thread_id: email.threadId,
                email_date: date.toISOString(),
                subject,
                sender: from,
                retailer_detected: classification.retailer,
                order_created: !!orderId,
                order_id: orderId,
                parse_error: parseError,
                processed_at: new Date().toISOString()
              }, {
                onConflict: 'email_account_id,gmail_message_id'
              })
          } else {
            // For incremental scan: Just insert (we already filtered out processed ones)
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
          }

          processed++
        } catch (error) {
          errors++
          console.error('Error processing email:', error)
        }
      }

      // Update progress with performance metrics
      const batchElapsed = Date.now() - scanStartTime
      const emailsPerSecond = processed / (batchElapsed / 1000)
      
      await supabase
        .from('email_scan_jobs')
        .update({
          emails_processed: processed,
          orders_created: ordersCreated,
          errors_count: errors,
          // Add performance info to last_error temporarily
          last_error: `Processing: ${emailsPerSecond.toFixed(1)} emails/sec, ${aiAnalysisCount} AI analyzed`
        })
        .eq('id', jobId)
      
      console.log(`Progress: ${processed}/${totalEmails} emails, ${ordersCreated} orders, ${emailsPerSecond.toFixed(1)} emails/sec`)
    }

    // Calculate final metrics
    const totalElapsed = Date.now() - scanStartTime
    const totalSeconds = totalElapsed / 1000
    const avgEmailsPerSecond = processed / totalSeconds
    const estimatedCost = aiAnalysisCount * 0.003 // ~$0.003 per email
    
    console.log(`Scan completed in ${totalSeconds.toFixed(1)}s:`)
    console.log(`- ${processed} emails processed (${avgEmailsPerSecond.toFixed(1)}/sec)`)
    console.log(`- ${aiAnalysisCount} emails analyzed by AI`)
    console.log(`- ${ordersCreated} orders created`)
    console.log(`- Estimated cost: $${estimatedCost.toFixed(2)}`)

    // Mark job as completed
    await supabase
      .from('email_scan_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        emails_processed: processed,
        orders_created: ordersCreated,
        errors_count: errors,
        // Store performance metrics
        last_error: `Completed in ${totalSeconds.toFixed(0)}s (${avgEmailsPerSecond.toFixed(1)} emails/sec). AI: ${aiAnalysisCount} emails, cost: $${estimatedCost.toFixed(2)}`
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