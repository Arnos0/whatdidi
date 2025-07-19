import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { geminiService } from '@/lib/ai/gemini-service'
import { buildMVPPrompt } from '@/lib/ai/prompt-builder'
import { detectEmailLanguage } from '@/lib/email/utils/language-detector'
import { normalizeOrderStatus } from '@/lib/utils/status-mapper'
import { parseFlexibleNumber } from '@/lib/utils/dutch-number-parser'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { 
  validateWebhookPayload, 
  formatValidationErrors,
  transformFormData,
  type ManualOrderPayload,
  type EmailOrderPayload
} from '@/lib/validators/n8n-schemas'
import { ApiErrors, createErrorResponse } from '@/lib/utils/api-errors'

/**
 * MVP Webhook endpoint for n8n integration
 * Handles both manual order entry and forwarded email processing
 */

// Validate webhook token and signature
const WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN
const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET // For HMAC signature verification

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

// Verify HMAC signature for webhook payload
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  
  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
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
  // Apply rate limiting first (10 requests per minute for webhooks)
  const rateLimitResponse = await withRateLimit(req, 'webhook', 10)
  if (rateLimitResponse) {
    return addSecurityHeaders(rateLimitResponse)
  }

  try {
    // Security: Check content length (max 1MB)
    const contentLength = req.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1048576) {
      return addSecurityHeaders(createErrorResponse('Request too large', 413))
    }

    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Validate webhook token with timing-safe comparison
    const token = req.headers.get('x-webhook-token')
    if (!WEBHOOK_TOKEN || !verifyToken(token, WEBHOOK_TOKEN)) {
      return addSecurityHeaders(ApiErrors.unauthorized())
    }
    
    // Verify HMAC signature if secret is configured
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get('x-webhook-signature')
      if (!verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
        return addSecurityHeaders(ApiErrors.unauthorized())
      }
    }

    // Parse and transform payload with size protection
    const rawPayload = JSON.parse(rawBody)
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
    // Log webhook activity without exposing email

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
        // Creating dev test user
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
          return createErrorResponse(createError, 500, 'Failed to create test user')
        }
        user = newUser
      } else {
        return ApiErrors.notFound('User')
      }
    }

    // Handle based on type
    if (payload.type === 'manual_order') {
      return await handleManualOrder(supabase, user.id, payload)
    } else if (payload.type === 'email') {
      return await handleEmailOrder(supabase, user.id, payload)
    }

    return ApiErrors.badRequest('Invalid payload type')

  } catch (error) {
    return ApiErrors.serverError(error)
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
      return createErrorResponse(orderError, 500, 'Failed to create order')
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
        // Order items error - non-critical, continuing
      }
    }

    return addSecurityHeaders(NextResponse.json({
      success: true,
      order_id: newOrder.id,
      message: 'Manual order created successfully'
    }))

  } catch (error) {
    return createErrorResponse(error, 500, 'Failed to process manual order')
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

    // Processing email with detected language

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
      return createErrorResponse(orderError, 500, 'Failed to create order from email')
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
        // Order items error - non-critical
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
    return createErrorResponse(error, 500, 'Failed to process email order')
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