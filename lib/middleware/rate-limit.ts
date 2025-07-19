import { NextRequest, NextResponse } from 'next/server'
import rateLimit from 'next-rate-limit'

// Rate limiting configurations for different endpoint types
const rateLimitConfigs = {
  api: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // 500 unique IPs per minute
  },
  auth: {
    interval: 60 * 1000, // 1 minute  
    uniqueTokenPerInterval: 100, // 100 unique IPs per minute
  },
  webhook: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 50, // 50 unique IPs per minute
  },
  emailScan: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 200, // 200 unique IPs per minute
  }
}

export type RateLimitType = keyof typeof rateLimitConfigs

/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api',
  maxRequests: number = 100
): Promise<NextResponse | null> {
  try {
    const config = rateLimitConfigs[type]
    
    // Create rate limiter with config
    const limiter = rateLimit({
      interval: config.interval,
      uniqueTokenPerInterval: config.uniqueTokenPerInterval,
    })
    
    // Check rate limit using the next-rate-limit API
    const headers = limiter.checkNext(request, maxRequests)
    
    // Return null if rate limit check passed (headers returned means success)
    return null
  } catch (error) {
    // Rate limit exceeded - next-rate-limit throws on limit exceeded
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    )
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from headers (if authenticated)
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimitedHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = 'api',
  maxRequests: number = 100
) {
  return async function rateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    // Check rate limit first
    const rateLimitResponse = await withRateLimit(request, type, maxRequests)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // If rate limit passed, call the original handler
    return handler(request)
  }
}

/**
 * Rate limiting decorator for specific endpoint types
 */
export const rateLimitDecorators = {
  api: (maxRequests = 100) => (handler: Function) => 
    withRateLimitedHandler(handler as any, 'api', maxRequests),
  
  auth: (maxRequests = 20) => (handler: Function) => 
    withRateLimitedHandler(handler as any, 'auth', maxRequests),
  
  webhook: (maxRequests = 10) => (handler: Function) => 
    withRateLimitedHandler(handler as any, 'webhook', maxRequests),
  
  emailScan: (maxRequests = 30) => (handler: Function) => 
    withRateLimitedHandler(handler as any, 'emailScan', maxRequests)
}