import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET() {
  try {
    // First, check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'
        }
      })
    }
    
    // Test basic HTTP connectivity first
    try {
      const healthCheckUrl = `${supabaseUrl}/health`
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey
        }
      })
      
      console.log('Health check response:', response.status, response.statusText)
    } catch (fetchError) {
      console.error('Direct fetch error:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Network connectivity failed',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        url: supabaseUrl,
        timestamp: new Date().toISOString()
      })
    }
    
    // Test Supabase client connection
    const supabase = createServerClient()
    
    // Simple health check query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: error.message,
        code: error.code,
        url: supabaseUrl
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}