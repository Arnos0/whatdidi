import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter without any module-level execution
export type RateLimitType = 'api' | 'auth' | 'webhook' | 'emailScan'

// Store for rate limit tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const DEFAULT_MAX_REQUESTS = 100

/**
 * Simple rate limiting check
 */
export async function withRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api',
  maxRequests: number = DEFAULT_MAX_REQUESTS
): Promise<NextResponse | null> {
  // Skip if disabled
  if (process.env.DISABLE_RATE_LIMIT === 'true') {
    return null
  }

  try {
    const now = Date.now()
    const clientId = getClientIdentifier(request)
    const key = `${type}:${clientId}`
    
    // Clean old entries
    cleanOldEntries(now)
    
    // Get or create entry
    let entry = rateLimitStore.get(key)
    
    if (!entry || entry.resetTime < now) {
      // Create new window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW
      })
      return null
    }
    
    // Check limit
    if (entry.count >= maxRequests) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString()
          }
        }
      )
    }
    
    // Increment count
    entry.count++
    return null
    
  } catch (error) {
    // Don't crash on rate limit errors
    console.error('Rate limit error:', error)
    return null
  }
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  return ip
}

function cleanOldEntries(now: number) {
  // Only clean every 100 requests to avoid performance issues
  if (Math.random() > 0.01) return
  
  // Use forEach for better compatibility
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  })
}

export function withRateLimitedHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: RateLimitType = 'api',
  maxRequests: number = DEFAULT_MAX_REQUESTS
) {
  return async function rateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    const rateLimitResponse = await withRateLimit(request, type, maxRequests)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    return handler(request)
  }
}

export const rateLimitDecorators = {
  api: (maxRequests = 100) => (handler: Function) => handler,
  auth: (maxRequests = 20) => (handler: Function) => handler,
  webhook: (maxRequests = 10) => (handler: Function) => handler,
  emailScan: (maxRequests = 30) => (handler: Function) => handler
}