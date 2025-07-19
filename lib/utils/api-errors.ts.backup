import { NextResponse } from 'next/server'

/**
 * Safe error response utility that prevents sensitive information leakage
 */

interface ErrorResponse {
  error: string
  code?: string
  requestId?: string
}

/**
 * Create a safe error response that doesn't expose internal details
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  userMessage?: string
): NextResponse<ErrorResponse> {
  // Log the actual error server-side (in production, this would go to a logging service)
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', error)
  }

  // Generate a request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Map common status codes to user-friendly messages
  const defaultMessages: Record<number, string> = {
    400: 'Invalid request',
    401: 'Authentication required',
    403: 'Access denied',
    404: 'Resource not found',
    409: 'Conflict with existing resource',
    429: 'Too many requests',
    500: 'Internal server error',
    503: 'Service temporarily unavailable'
  }

  const response: ErrorResponse = {
    error: userMessage || defaultMessages[statusCode] || 'An error occurred',
    requestId
  }

  // Add error code for client-side handling
  if (statusCode === 400) response.code = 'INVALID_REQUEST'
  if (statusCode === 401) response.code = 'UNAUTHORIZED'
  if (statusCode === 403) response.code = 'FORBIDDEN'
  if (statusCode === 404) response.code = 'NOT_FOUND'
  if (statusCode === 429) response.code = 'RATE_LIMITED'

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => createErrorResponse('Unauthorized', 401),
  forbidden: () => createErrorResponse('Forbidden', 403),
  notFound: (resource: string = 'Resource') => 
    createErrorResponse(`${resource} not found`, 404),
  badRequest: (message?: string) => 
    createErrorResponse('Bad request', 400, message),
  serverError: (error: unknown) => 
    createErrorResponse(error, 500),
  rateLimit: () => 
    createErrorResponse('Rate limit exceeded', 429),
  conflict: (message?: string) => 
    createErrorResponse('Conflict', 409, message)
}

/**
 * Extract safe error message for logging
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unknown error'
}