import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1)
    
    if (error) {
      console.error('Database connection error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Test DB error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}