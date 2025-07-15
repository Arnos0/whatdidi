import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET() {
  try {
    // Test basic connection
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
        code: error.code
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
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