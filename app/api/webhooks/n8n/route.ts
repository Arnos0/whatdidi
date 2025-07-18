import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { geminiService } from '@/lib/ai/gemini-service'
import { buildMVPPrompt } from '@/lib/ai/prompt-builder'
import { detectEmailLanguage } from '@/lib/email/utils/language-detector'
import { normalizeOrderStatus } from '@/lib/utils/status-mapper'
import { parseFlexibleNumber } from '@/lib/utils/dutch-number-parser'
import { 
  validateWebhookPayload, 
  formatValidationErrors,
  transformFormData,
  type ManualOrderPayload,
  type EmailOrderPayload
} from '@/lib/validators/n8n-schemas'

/**
 * MVP Webhook endpoint for n8n integration
 * Handles both manual order entry and forwarded email processing
 */

// Validate webhook token
const WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN

// Timing-safe token comparison
function verifyToken(providedToken: string | null, expectedToken: string): boolean {
  if (!providedToken || !expectedToken) return false
  
  // Ensure equal length for timing safety
  if (providedToken.length !== expectedToken.length) return false
  
  // Use crypto.timingSafeEqual for constant-time comparison
  try {
    const crypto = require('crypto')
    const providedBuffer = Buffer.from(providedToken, 'utf8')
    const expectedBuffer = Buffer.from(expectedToken, 'utf8')
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  } catch {
    return false
  }
}

// Add security headers to response
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Content-Security-Policy', "default-src 'none'")
  return response
}

export async function POST(req: NextRequest) {
  try {
    // Security: Check content length (max 1MB)
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1048576) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      ))
    }

    // Validate webhook token with timing-safe comparison
    const token = req.headers.get('x-webhook-token')
    if (!WEBHOOK_TOKEN || !verifyToken(token, WEBHOOK_TOKEN)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ))
    }

    // Parse and transform payload with size protection
    const rawPayload = await req.json()
    const transformedPayload = transformFormData(rawPayload)
    
    // Validate payload
    const validation = validateWebhookPayload(transformedPayload)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid payload', 
          ...formatValidationErrors(validation.error!) 
        },
        { status: 400 }
      )
    }
    
    const payload = validation.data!
    console.log('n8n webhook received:', payload.type, 'for user:', payload.user_email.replace(/[@.]/g, '*'))

    // Get user from email
    const supabase = createServerClient()
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', payload.user_email)
      .single()

    // Handle user not found
    if (userError || !user) {
      // SECURITY: Only allow test user creation in development
      if (process.env.NODE_ENV === 'development' && 
          (payload.user_email.includes('test') || payload.user_email.includes('arno'))) {
        console.log('Creating dev test user:', payload.user_email.replace(/[@.]/g, '*'))
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: payload.user_email,
            clerk_id: 'test-clerk-id-' + Date.now(),
            name: 'Test User'
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Test user creation failed:', createError.code)
          return NextResponse.json(
            { error: 'Failed to create test user' },
            { status: 500 }
          )
        }
        user = newUser
      } else {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Handle based on type
    if (payload.type === 'manual_order') {
      return await handleManualOrder(supabase, user.id, payload)
    } else if (payload.type === 'email') {
      return await handleEmailOrder(supabase, user.id, payload)
    }

    return NextResponse.json(
      { error: 'Invalid payload type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleManualOrder(
  supabase: any,
  userId: string,
  payload: ManualOrderPayload
) {
  const { order } = payload

  try {
    // Create order with is_manual=true
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: order.order_number,
        retailer: order.retailer,
        amount: order.amount,
        currency: order.currency || 'EUR',
        order_date: order.order_date,
        status: normalizeOrderStatus(order.status),
        tracking_number: order.tracking_number || null,
        carrier: order.carrier?.toLowerCase() || null,
        estimated_delivery: order.estimated_delivery || null,
        is_manual: true,
        needs_review: false, // Manual entries don't need review
        raw_email_data: { source: 'n8n_manual_form' }
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      )
    }

    // Add order items if provided
    if (order.items && order.items.length > 0) {
      const orderItems = order.items.map(item => ({
        order_id: newOrder.id,
        description: item.description,
        quantity: item.quantity || 1,
        price: item.price || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items error:', itemsError)
        // Don't fail the whole request, just log it
      }
    }

    return addSecurityHeaders(NextResponse.json({
      success: true,
      order_id: newOrder.id,
      message: 'Manual order created successfully'
    }))

  } catch (error) {
    console.error('Manual order processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process manual order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function handleEmailOrder(
  supabase: any,
  userId: string,
  payload: EmailOrderPayload
) {
  const { email } = payload

  try {
    // Prepare email content for analysis
    const emailBody = email.body_plain || email.body_html || ''
    const senderDomain = email.from.match(/@([^>]+)/)?.[1]
    
    // Detect language
    const detectedLanguage = detectEmailLanguage(
      `${email.subject} ${emailBody}`,
      senderDomain
    )

    console.log(`Processing email from ${email.from.replace(/[@.]/g, '*')} in ${detectedLanguage}`)

    // Build MVP prompt and analyze with Gemini
    const emailContent = {
      subject: email.subject,
      from: email.from,
      date: new Date(email.date),
      body: emailBody
    }

    const analysis = await geminiService.analyzeEmail(emailContent, detectedLanguage)

    if (!analysis.isOrder || !analysis.orderData) {
      return NextResponse.json({
        success: false,
        message: 'Email is not an order',
        debug: analysis.debugInfo
      })
    }

    // Check confidence threshold
    const confidence = analysis.orderData.confidence || 0.5
    const needsReview = confidence < 0.7

    // Normalize data for database
    const orderData = {
      user_id: userId,
      order_number: analysis.orderData.orderNumber || `AUTO-${Date.now()}`,
      retailer: analysis.orderData.retailer || 'Unknown',
      amount: parseFlexibleNumber(analysis.orderData.amount),
      currency: analysis.orderData.currency || 'EUR',
      order_date: analysis.orderData.orderDate || new Date().toISOString().split('T')[0],
      status: normalizeOrderStatus(analysis.orderData.status || 'pending'),
      tracking_number: analysis.orderData.trackingNumber || null,
      carrier: analysis.orderData.carrier?.toLowerCase() || null,
      estimated_delivery: analysis.orderData.estimatedDelivery || null,
      is_manual: false,
      needs_review: needsReview,
      raw_email_data: {
        ...email.raw_email_data,
        gemini_analysis: analysis,
        detected_language: detectedLanguage,
        confidence: confidence
      }
    }

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order from email', details: orderError.message },
        { status: 500 }
      )
    }

    // Add order items if extracted
    if (analysis.orderData.items && analysis.orderData.items.length > 0) {
      const orderItems = analysis.orderData.items.map((item: any) => ({
        order_id: newOrder.id,
        description: item.name,
        quantity: item.quantity || 1,
        price: parseFlexibleNumber(item.price) || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items error:', itemsError)
      }
    }

    return addSecurityHeaders(NextResponse.json({
      success: true,
      order_id: newOrder.id,
      needs_review: needsReview,
      confidence: confidence,
      detected_language: detectedLanguage,
      message: needsReview 
        ? 'Order created but needs review (low confidence)'
        : 'Order created successfully from email'
    }))

  } catch (error) {
    console.error('Email order processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process email order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// OPTIONS endpoint for CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-webhook-token',
    },
  })
}