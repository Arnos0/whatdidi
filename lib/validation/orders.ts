import { z } from 'zod'

export const orderQuerySchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().max(100).optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const orderIdSchema = z.object({
  id: z.string().uuid()
})

export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  tracking_number: z.string().max(100).optional(),
  carrier: z.string().max(50).optional(),
  estimated_delivery: z.string().datetime().optional(),
})

export type OrderQueryParams = z.infer<typeof orderQuerySchema>
export type OrderUpdateData = z.infer<typeof orderUpdateSchema>