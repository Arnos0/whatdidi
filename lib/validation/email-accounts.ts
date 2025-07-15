import { z } from 'zod'

export const emailProviderSchema = z.enum(['gmail', 'outlook'])

export const oAuthCallbackSchema = z.object({
  code: z.string().min(1).max(1000),
  state: z.string().min(1).max(100),
  error: z.string().optional(),
  error_description: z.string().optional()
})

export const emailAccountIdSchema = z.object({
  id: z.string().uuid()
})

export const connectEmailSchema = z.object({
  provider: emailProviderSchema
})

export type EmailProvider = z.infer<typeof emailProviderSchema>
export type OAuthCallbackParams = z.infer<typeof oAuthCallbackSchema>