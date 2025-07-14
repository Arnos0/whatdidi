import { z } from 'zod'

// Supported retailers - can be expanded over time
export const RETAILERS = [
  'Bol.com',
  'Coolblue',
  'Zalando',
  'Amazon',
  'MediaMarkt',
  'Albert Heijn',
  'Jumbo',
  'HEMA',
  'IKEA',
  'Decathlon',
  'Other'
] as const

// Supported carriers
export const CARRIERS = [
  'postnl',
  'dhl',
  'dpd',
  'ups',
  'fedex',
  'other'
] as const

// Order item schema
export const orderItemSchema = z.object({
  description: z.string()
    .min(1, 'Item description is required')
    .max(200, 'Description too long'),
  quantity: z.coerce.number()
    .min(1, 'Quantity must be at least 1')
    .max(999, 'Quantity too large'),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(999999, 'Price too large')
    .optional()
    .nullable()
    .or(z.undefined()),
  image_url: z.string().url().optional().or(z.literal('')),
  product_url: z.string().url().optional().or(z.literal(''))
})

// Main order form schema
export const createOrderSchema = z.object({
  // Basic order information
  orderNumber: z.string()
    .min(1, 'Order number is required')
    .max(100, 'Order number too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Order number can only contain letters, numbers, hyphens, and underscores'),
  
  retailer: z.string()
    .min(1, 'Retailer is required')
    .max(100, 'Retailer name too long')
    .transform(val => val.trim()) // Trim whitespace
    .refine(val => !/[<>]/.test(val), 'Retailer name contains invalid characters'), // Basic XSS prevention
  
  amount: z.coerce.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999.99, 'Amount too large'),
  
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .default('EUR'),
    
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending'),
  
  orderDate: z.date({
    required_error: 'Order date is required',
    invalid_type_error: 'Invalid date',
  }),
  
  // Optional tracking information
  trackingNumber: z.string()
    .max(100, 'Tracking number too long')
    .optional()
    .or(z.literal('')),
  
  carrier: z.enum(CARRIERS).optional(),
  
  estimatedDelivery: z.date().optional().nullable(),
  
  // Order items (at least one required)
  items: z.array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Too many items'),
  
  // Notes (optional)
  notes: z.string()
    .max(500, 'Notes too long')
    .optional(),
    
  // Receipt file (optional)
  receiptFile: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'].includes(file.type),
      'File must be an image (JPEG, PNG, GIF, WebP) or PDF'
    )
    .optional()
})

// Type inference
export type CreateOrderFormData = z.infer<typeof createOrderSchema>
export type CreateOrderInput = CreateOrderFormData
export type OrderItemFormData = z.infer<typeof orderItemSchema>

// Initial empty item
export const emptyOrderItem: OrderItemFormData = {
  description: '',
  quantity: 1,
  price: undefined,
  image_url: '',
  product_url: ''
}

// Validation for file uploads
export const receiptFileSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type),
      'File must be an image (JPEG, PNG, WebP) or PDF'
    )
    .optional()
})

export type ReceiptFileData = z.infer<typeof receiptFileSchema>