import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get all recent scan jobs
    const { data: scanJobs, error } = await supabase
      .from('email_scan_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      scanJobs: scanJobs || [],
      count: scanJobs?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch scans',
      message: error.message 
    }, { status: 500 })
  }
}