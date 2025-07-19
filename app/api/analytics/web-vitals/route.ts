import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { ApiErrors, createErrorResponse } from '@/lib/utils/api-errors'

// Web Vitals data schema
const webVitalsSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  delta: z.number(),
  url: z.string().url(),
  timestamp: z.number(),
  entries: z.array(z.any()).optional()
})

export async function POST(request: NextRequest) {
  // Apply rate limiting (20 requests per minute for analytics)
  const rateLimitResponse = await withRateLimit(request, 'api', 20)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const validatedData = webVitalsSchema.parse(body)

    // Process Web Vitals data (in production, send to proper analytics service)

    // In a production environment, you would:
    // 1. Store in a database (PostgreSQL, InfluxDB, etc.)
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Send to monitoring service (DataDog, New Relic, etc.)
    
    // Example: Store in database
    // await storeWebVitalsMetric(validatedData)
    
    // Example: Send to Google Analytics
    // await sendToGoogleAnalytics(validatedData)

    return NextResponse.json({ 
      success: true, 
      message: 'Web Vitals data received' 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest('Invalid data format')
    }

    return ApiErrors.serverError(error)
  }
}

// Optional: GET endpoint to retrieve Web Vitals analytics
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, 'api', 100)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // In production, this would query your analytics database
    // For now, return mock data to show the structure
    const mockData = {
      summary: {
        totalPageViews: 1234,
        averageLCP: 2100,
        averageFID: 85,
        averageCLS: 0.08,
        averageFCP: 1650,
        averageTTFB: 720
      },
      recent: [
        {
          timestamp: Date.now() - 3600000, // 1 hour ago
          lcp: { value: 2050, rating: 'good' },
          fid: { value: 95, rating: 'good' },
          cls: { value: 0.12, rating: 'needs-improvement' }
        }
      ]
    }

    return NextResponse.json(mockData)
  } catch (error) {
    return createErrorResponse(error, 500, 'Failed to fetch analytics data')
  }
}