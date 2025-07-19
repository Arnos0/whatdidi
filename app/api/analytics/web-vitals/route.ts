import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/middleware/rate-limit'

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

    // Log Web Vitals data (in production, you'd want to send to a proper analytics service)
    console.log('📊 Web Vitals Metric:', {
      metric: validatedData.name,
      value: validatedData.value,
      rating: validatedData.rating,
      url: validatedData.url,
      timestamp: new Date(validatedData.timestamp).toISOString()
    })

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
    console.error('Web Vitals API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid data format', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
    console.error('Failed to fetch Web Vitals data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}