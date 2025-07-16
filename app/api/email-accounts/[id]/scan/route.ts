import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { createServerClient } from '@/lib/supabase/server-client'
import { GmailService } from '@/lib/email/gmail-service'
import { AIEmailClassifier } from '@/lib/email/ai-parser'
import { aiService } from '@/lib/ai/ai-service'
import { registerParsers } from '@/lib/email/parsers'
import type { DateRange, ScanType } from '@/lib/types/email'

// Initialize parsers once
registerParsers()

const scanRequestSchema = z.object({
  dateRange: z.enum(['1_week', '2_weeks', '1_month', '3_months', '6_months']).default('2_weeks'),
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
    const aiProvider = process.env.AI_SERVICE || 'gemini'
    if (aiProvider === 'claude' && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.')
    } else if (aiProvider === 'gemini' && !process.env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not configured. Please add it to your environment variables.')
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

    // Log exact date range being scanned
    const dateFrom = getDateFromRange(dateRange)
    const dateTo = new Date()
    console.log(`Scan job ${jobId}: Scanning emails from ${dateFrom?.toISOString()} to ${dateTo.toISOString()}`)
    console.log(`Date range: ${dateRange} (${dateFrom ? Math.round((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)) : 'all'} days)`)

    // Search for order emails
    const searchResult = await gmail.searchOrderEmails(dateRange)
    const totalEmails = searchResult.messages?.length || 0

    console.log(`Scan job ${jobId}: Found ${totalEmails} emails (estimated: ${searchResult.resultSizeEstimate})`)

    // Update job with email count
    await supabase
      .from('email_scan_jobs')
      .update({ emails_found: totalEmails })
      .eq('id', jobId)

    // Process emails in larger batches with Gemini (no rate limits!)
    const batchSize = process.env.AI_SERVICE === 'claude' ? 10 : 50 // Gemini can handle larger batches
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
      const emailsWithParsers: Array<{ email: typeof emails[0], parser: any }> = []
      const emailsToSkip: typeof emails = []
      const emailClassifications = new Map<string, any>()
      
      for (const email of emails) {
        const classification = AIEmailClassifier.classify(email)
        emailClassifications.set(email.id, classification)
        
        // Check if this email has a specific parser (like DHL)
        if (classification.parser && classification.retailer && classification.retailer !== 'Pending AI Analysis') {
          emailsWithParsers.push({ email, parser: classification.parser })
          console.log(`Using specific parser for ${classification.retailer} email`)
        } else if (classification.parser) {
          emailsToAnalyze.push(email)
        } else {
          emailsToSkip.push(email)
        }
      }
      
      console.log(`Batch: ${emailsToAnalyze.length} emails for AI analysis, ${emailsWithParsers.length} with specific parsers, ${emailsToSkip.length} skipped`)
      
      // Log Coolblue emails specifically
      const coolblueEmails = emails.filter(email => {
        const { from, subject } = GmailService.extractContent(email)
        return from.toLowerCase().includes('coolblue') || subject.toLowerCase().includes('coolblue')
      })
      if (coolblueEmails.length > 0) {
        console.log(`Found ${coolblueEmails.length} Coolblue emails in this batch`)
        coolblueEmails.forEach(email => {
          const { subject, from, date } = GmailService.extractContent(email)
          const classification = emailClassifications.get(email.id)
          console.log(`Coolblue email: "${subject}" from ${from} on ${date.toISOString()}`)
          console.log(`  - Classification: ${classification?.parser || 'none'}, retailer: ${classification?.retailer}`)
          console.log(`  - Will analyze with AI: ${emailsToAnalyze.includes(email)}`)
        })
      }
      
      // Process emails with specific parsers first
      const parserResults = new Map<string, any>()
      for (const { email, parser } of emailsWithParsers) {
        try {
          const parsedOrder = await parser.parse(email)
          if (parsedOrder) {
            // Log what the parser returned
            console.log(`Parser ${parser.getRetailerName()} returned:`, {
              order_number: parsedOrder.order_number,
              amount: parsedOrder.amount,
              items: parsedOrder.items?.length || 0,
              confidence: parsedOrder.confidence
            })
            
            // Don't use results with invalid order numbers
            if (parsedOrder.order_number === "0" || parsedOrder.order_number === 0 || !parsedOrder.order_number) {
              console.log(`WARNING: Parser ${parser.getRetailerName()} returned invalid order number: "${parsedOrder.order_number}"`)
              // Don't add to results, let AI handle it instead
            } else {
              parserResults.set(email.id, parsedOrder)
              console.log(`Parser ${parser.getRetailerName()} found valid order: ${parsedOrder.order_number}`)
            }
          }
        } catch (error) {
          console.error(`Parser ${parser.getRetailerName()} failed:`, error)
        }
      }
      
      // Process AI emails in smaller groups to avoid overwhelming the system
      const aiResults = new Map<string, any>()
      if (emailsToAnalyze.length > 0) {
        const aiStartTime = Date.now()
        
        try {
          // Prepare emails for batch analysis
          const emailsForAI = emailsToAnalyze.map(email => {
            const { subject, from, date, htmlBody, textBody } = GmailService.extractContent(email)
            
            // Prioritize plain text over HTML for cleaner content
            let body = textBody || htmlBody || ''
            
            // Log Coolblue email content for debugging
            if (from.toLowerCase().includes('coolblue')) {
              console.log(`\n=== COOLBLUE EMAIL DEBUG ===`)
              console.log(`Subject: "${subject}"`)
              console.log(`From: ${from}`)
              console.log(`Has textBody: ${!!textBody} (${textBody.length} chars)`)
              console.log(`Has htmlBody: ${!!htmlBody} (${htmlBody.length} chars)`)
              if (textBody) {
                console.log(`Plain text preview (first 1000 chars):`)
                console.log(textBody.substring(0, 1000))
                console.log(`\n--- END PREVIEW ---\n`)
              }
            }
            
            return {
              id: email.id,
              subject,
              from,
              date,
              body: body.substring(0, 10000) // Increased to 10000 chars for better order extraction
            }
          })
          
          // Use batch analysis with error handling
          const batchResults = await aiService.batchAnalyzeEmails(emailsForAI)
          
          // Process results
          for (const email of emailsToAnalyze) {
            const result = batchResults.get(email.id)
            const { from, subject } = GmailService.extractContent(email)
            
            // Log Coolblue AI results specifically
            if (from.toLowerCase().includes('coolblue') || subject.toLowerCase().includes('coolblue')) {
              console.log(`Coolblue AI result for "${subject}":`)
              console.log(`  - isOrder: ${result?.isOrder}, confidence: ${result?.orderData?.confidence}`)
              if (result?.orderData) {
                console.log(`  - Order: ${result.orderData.retailer} ${result.orderData.currency} ${result.orderData.amount}`)
              }
            }
            
            if (result && result.isOrder && result.orderData) {
              // Map camelCase properties from AI to snake_case for database
              // Also map 'confirmed' status to 'pending' as database doesn't allow 'confirmed'
              const mappedStatus = result.orderData.status === 'confirmed' ? 'pending' : result.orderData.status
              
              aiResults.set(email.id, {
                order_number: result.orderData.orderNumber,
                retailer: result.orderData.retailer,
                amount: result.orderData.amount,
                currency: result.orderData.currency,
                order_date: result.orderData.orderDate,
                status: mappedStatus || 'pending',
                estimated_delivery: result.orderData.estimatedDelivery,
                tracking_number: result.orderData.trackingNumber,
                carrier: result.orderData.carrier,
                items: result.orderData.items,
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
          
          // Extract email metadata early
          const { subject, from, date } = GmailService.extractContent(email)
          
          // Check parser results first, then AI results
          const parsedOrder = parserResults.get(email.id) || aiResults.get(email.id)
          
          if (parsedOrder) {
            console.log(`AI found order: ${parsedOrder.retailer} - ${parsedOrder.order_number}`)
            
            if (parsedOrder && parsedOrder.confidence > 0.7) {
              let existingOrder = null
                
                // For DHL tracking emails, try to find order by tracking number
                if (parsedOrder.retailer === 'DHL Tracking' && parsedOrder.tracking_number) {
                  console.log(`DHL: Starting tracking lookup for ${parsedOrder.tracking_number}`)
                  
                  try {
                    // First try to find by tracking number
                    console.log(`DHL: Querying orders table for tracking number...`)
                    const { data, error } = await supabase
                      .from('orders')
                      .select('id')
                      .eq('user_id', emailAccount.user_id)
                      .eq('tracking_number', parsedOrder.tracking_number)
                      .maybeSingle() // Use maybeSingle to handle 0 or 1 results
                    
                    if (error) {
                      console.error(`DHL: Error finding order by tracking number:`, error)
                      throw error
                    }
                    
                    existingOrder = data
                    console.log(`DHL: Found existing order by tracking:`, existingOrder ? 'YES' : 'NO')
                  } catch (error) {
                    console.error(`DHL: Failed to query orders by tracking number:`, error)
                    // Continue processing even if this query fails
                  }
                  
                  // If not found by tracking number, try to find recent orders without tracking
                  if (!existingOrder) {
                    console.log(`DHL: No existing order found, searching for recent orders without tracking...`)
                    
                    try {
                      const retailerName = parsedOrder.retailer.replace('DHL Tracking', '').trim()
                      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
                      
                      console.log(`DHL: Searching for orders from ${twoWeeksAgo} onwards`)
                      
                      const { data: recentOrders, error: recentOrdersError } = await supabase
                        .from('orders')
                        .select('id, order_number, retailer')
                        .eq('user_id', emailAccount.user_id)
                        .is('tracking_number', null)
                        .in('status', ['pending', 'processing', 'confirmed'])
                        .gte('order_date', twoWeeksAgo)
                        .order('order_date', { ascending: false })
                        .limit(5)
                      
                      if (recentOrdersError) {
                        console.error(`DHL: Error finding recent orders:`, recentOrdersError)
                        throw recentOrdersError
                      }
                      
                      console.log(`DHL: Found ${recentOrders?.length || 0} recent orders without tracking`)
                      
                      // Try to match by retailer name or find most recent untracked order
                      if (recentOrders && recentOrders.length > 0) {
                        console.log(`DHL: Attempting to match orders with retailer name: "${retailerName}"`)
                        
                        // Check if DHL email mentions a specific retailer
                        if (retailerName && retailerName !== 'DHL Tracking') {
                          existingOrder = recentOrders.find(o => 
                            o.retailer.toLowerCase().includes(retailerName.toLowerCase())
                          ) || recentOrders[0]
                          console.log(`DHL: Matched by retailer name: ${existingOrder ? 'YES' : 'NO'}`)
                        } else {
                          // Use most recent order without tracking
                          existingOrder = recentOrders[0]
                          console.log(`DHL: Using most recent order without tracking`)
                        }
                        
                        if (existingOrder) {
                          console.log(`DHL: Linking tracking ${parsedOrder.tracking_number} to order ${existingOrder.order_number} from ${existingOrder.retailer}`)
                        }
                      }
                    } catch (error) {
                      console.error(`DHL: Failed to find recent orders:`, error)
                      // Continue processing even if this query fails
                    }
                  }
                  
                  // If found, update the order with tracking info and status
                  if (existingOrder) {
                    console.log(`DHL: Updating existing order ${existingOrder.id} with tracking info...`)
                    
                    try {
                      const { error: updateError } = await supabase
                        .from('orders')
                        .update({
                          status: parsedOrder.status,
                          tracking_number: parsedOrder.tracking_number,
                          carrier: 'DHL',
                          estimated_delivery: parsedOrder.estimated_delivery,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', existingOrder.id)
                      
                      if (updateError) {
                        console.error(`DHL: Error updating order ${existingOrder.id}:`, updateError)
                        throw updateError
                      }
                      
                      orderId = existingOrder.id
                      console.log(`DHL: Successfully updated order ${existingOrder.id} with tracking status`)
                    } catch (error) {
                      console.error(`DHL: Failed to update order ${existingOrder.id}:`, error)
                      // Continue processing even if update fails
                    }
                  } else {
                    console.log(`DHL: No existing order found to link tracking ${parsedOrder.tracking_number}`)
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
                  // For Coolblue, be more lenient if we're missing order number
                  const isCoolblue = parsedOrder.retailer.toLowerCase().includes('coolblue')
                  
                  // Debug Coolblue order data
                  if (isCoolblue) {
                    console.log(`\nCoolblue order data before validation:`)
                    console.log(`  order_number: "${parsedOrder.order_number}" (type: ${typeof parsedOrder.order_number})`)
                    console.log(`  amount: ${parsedOrder.amount} (type: ${typeof parsedOrder.amount})`)
                    console.log(`  currency: ${parsedOrder.currency}`)
                    console.log(`  items: ${parsedOrder.items?.length || 0} items`)
                  }
                  
                  // Fix order number if it's "0" or invalid
                  if (parsedOrder.order_number === "0" || parsedOrder.order_number === 0) {
                    console.log(`WARNING: Order number is "0", setting to empty string`)
                    parsedOrder.order_number = ""
                  }
                  
                  if (!parsedOrder.amount || parsedOrder.amount <= 0) {
                    console.log(`Skipping order creation - invalid amount: ${parsedOrder.amount} (type: ${typeof parsedOrder.amount})`)
                    parseError = 'Missing essential order data'
                  } else if (!parsedOrder.order_number && !isCoolblue) {
                    console.log(`Skipping order creation - missing order number for ${parsedOrder.retailer}`)
                    parseError = 'Missing essential order data'
                  } else {
                    // Generate order number for Coolblue if missing
                    if (!parsedOrder.order_number && isCoolblue) {
                      parsedOrder.order_number = `COOLBLUE-${date.getTime()}`
                      console.log(`Generated order number for Coolblue: ${parsedOrder.order_number}`)
                    }
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
                        // Validate and sanitize order items data
                        const validatedItems = parsedOrder.items
                          .filter((item: any) => 
                            item.name && 
                            typeof item.name === 'string' && 
                            item.name.trim().length > 0 && 
                            item.name.length <= 500 && // Prevent excessively long descriptions
                            typeof item.quantity === 'number' && 
                            item.quantity > 0 && 
                            item.quantity <= 1000 && // Reasonable quantity limit
                            typeof item.price === 'number' && 
                            item.price >= 0 && 
                            item.price <= 1000000 // Reasonable price limit
                          )
                          .slice(0, 50) // Limit to max 50 items per order
                          .map((item: any) => ({
                            order_id: newOrder.id,
                            description: item.name.trim().substring(0, 500), // Truncate if too long
                            quantity: Math.floor(item.quantity), // Ensure integer
                            price: Math.round(item.price * 100) / 100 // Round to 2 decimal places
                          }))
                        
                        if (validatedItems.length > 0) {
                          const { error: itemsError } = await supabase
                            .from('order_items')
                            .insert(validatedItems)
                          
                          if (itemsError) {
                            console.error('Failed to create order items:', itemsError)
                          } else {
                            console.log(`Created ${validatedItems.length} items for order ${newOrder.id}`)
                          }
                        }
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

          // Record processed email (should be outside the parsedOrder check)
          // (email metadata already extracted above)
          
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
                retailer_detected: emailClassifications.get(email.id)?.retailer,
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
                retailer_detected: emailClassifications.get(email.id)?.retailer,
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
    const costPerEmail = process.env.AI_SERVICE === 'claude' ? 0.003 : 0.00007 // Claude: $0.003, Gemini: $0.00007
    const estimatedCost = aiAnalysisCount * costPerEmail
    
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