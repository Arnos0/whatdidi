import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Check if tables exist
    const tables = [
      'users',
      'email_accounts',
      'orders',
      'order_items',
      'deliveries',
      'email_scan_jobs',
      'processed_emails'
    ]
    
    const tableStatus: Record<string, boolean> = {}
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1)
        
        tableStatus[table] = !error
      } catch (e) {
        tableStatus[table] = false
      }
    }
    
    // Check environment variables
    const envStatus = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      TOKEN_ENCRYPTION_KEY: !!process.env.TOKEN_ENCRYPTION_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'whatdidishop-api',
      server: {
        port: process.env.PORT || 3000,
        nodeVersion: process.version
      },
      database: {
        connected: true,
        tables: tableStatus
      },
      environment: envStatus
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'whatdidishop-api',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}