import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey
        }
      })
    }
    
    // Test with anon key (less privileged)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Simple query that should work with anon key
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Anon query failed',
        details: error.message,
        code: error.code,
        url: supabaseUrl
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Anon connection successful',
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Anon connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Anon connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}