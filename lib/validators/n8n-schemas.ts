import { z } from 'zod'

/**
 * Validation schemas for n8n webhook payloads
 * Used to validate incoming data from n8n workflows
 */

// Common schemas
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

const orderStatusSchema = z.enum(['confirmed', 'shipped', 'delivered', 'cancelled', 'pending'])

const carrierSchema = z.enum(['postnl', 'dhl', 'ups', 'dpd', 'gls', 'fedex'])

const currencySchema = z.enum(['EUR', 'USD', 'GBP']).default('EUR')

// Order item schema
const orderItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().int().positive().default(1),
  price: z.number().nonnegative().optional()
})

// Manual order schema
export const manualOrderSchema = z.object({
  type: z.literal('manual_order'),
  user_email: z.string().email('Valid email required'),
  order: z.object({
    order_number: z.string().min(1, 'Order number is required'),
    retailer: z.string().min(1, 'Retailer name is required'),
    amount: z.number().positive('Amount must be positive'),
    currency: currencySchema,
    order_date: dateSchema,
    status: orderStatusSchema.default('confirmed'),
    tracking_number: z.string().optional(),
    carrier: carrierSchema.optional(),
    estimated_delivery: dateSchema.optional(),
    items: z.array(orderItemSchema).optional()
  })
})

// Email schema
export const emailOrderSchema = z.object({
  type: z.literal('email'),
  user_email: z.string().email('Valid email required'),
  email: z.object({
    from: z.string().min(1, 'Email from address is required'),
    subject: z.string().min(1, 'Email subject is required'),
    date: z.string(), // ISO date string
    body_plain: z.string().optional(),
    body_html: z.string().optional(),
    raw_email_data: z.record(z.any()).optional()
  }).refine(
    (data) => data.body_plain || data.body_html,
    'Either body_plain or body_html must be provided'
  )
})

// Combined webhook payload schema
export const webhookPayloadSchema = z.discriminatedUnion('type', [
  manualOrderSchema,
  emailOrderSchema
])

// Type exports
export type ManualOrderPayload = z.infer<typeof manualOrderSchema>
export type EmailOrderPayload = z.infer<typeof emailOrderSchema>
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>

/**
 * Validate webhook payload and return typed result
 */
export function validateWebhookPayload(payload: unknown): {
  success: boolean
  data?: WebhookPayload
  error?: z.ZodError
} {
  try {
    const data = webhookPayloadSchema.parse(payload)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

/**
 * Format validation errors for API response
 */
export function formatValidationErrors(error: z.ZodError): {
  message: string
  errors: Array<{ path: string; message: string }>
} {
  const errors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }))

  return {
    message: 'Validation failed',
    errors
  }
}

/**
 * Validation helpers for n8n form configuration
 */
export const n8nFormValidation = {
  // Order number validation pattern
  orderNumberPattern: '^[A-Za-z0-9\\-]+$',
  orderNumberMessage: 'Order number can only contain letters, numbers, and hyphens',
  
  // Amount validation
  amountMin: 0.01,
  amountMax: 999999.99,
  amountStep: 0.01,
  
  // Date validation
  dateMin: '2020-01-01',
  dateMax: new Date().toISOString().split('T')[0], // Today
  
  // Text length limits
  retailerMaxLength: 100,
  descriptionMaxLength: 500,
  trackingNumberMaxLength: 100,
  
  // Array limits
  maxOrderItems: 50
}

/**
 * Transform n8n form data to match our schema
 * Handles common transformations needed from form input
 */
export function transformFormData(formData: any): any {
  const transformed = { ...formData }
  
  // Convert string numbers to actual numbers
  if (transformed.order?.amount && typeof transformed.order.amount === 'string') {
    transformed.order.amount = parseFloat(transformed.order.amount)
  }
  
  // Convert item prices
  if (transformed.order?.items) {
    transformed.order.items = transformed.order.items.map((item: any) => ({
      ...item,
      quantity: parseInt(item.quantity || '1'),
      price: item.price ? parseFloat(item.price) : undefined
    }))
  }
  
  // Ensure status is lowercase
  if (transformed.order?.status) {
    transformed.order.status = transformed.order.status.toLowerCase()
  }
  
  // Ensure carrier is lowercase
  if (transformed.order?.carrier) {
    transformed.order.carrier = transformed.order.carrier.toLowerCase()
  }
  
  return transformed
}