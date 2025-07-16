import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Update all running scans to failed
    const { data, error } = await supabase
      .from('email_scan_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        last_error: 'Manually stopped due to being stuck'
      })
      .eq('status', 'running')
      .select()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      message: 'Stopped running scans',
      stoppedCount: data?.length || 0,
      stoppedJobs: data
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to stop scan',
      message: error.message 
    }, { status: 500 })
  }
}