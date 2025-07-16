import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get latest scan job
    const { data: latestJob, error } = await supabase
      .from('email_scan_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching scan job:', error)
    }
    
    // Check if processScanJob is running
    const isProcessing = latestJob && latestJob.status === 'running'
    
    return NextResponse.json({
      latestJob: latestJob || 'No scan jobs found',
      isProcessing,
      jobAge: latestJob ? `${Math.round((Date.now() - new Date(latestJob.created_at).getTime()) / 1000)}s ago` : null,
      scanStatus: {
        status: latestJob?.status,
        emails_found: latestJob?.emails_found,
        emails_processed: latestJob?.emails_processed,
        orders_created: latestJob?.orders_created,
        last_error: latestJob?.last_error
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to debug scan',
      message: error.message 
    }, { status: 500 })
  }
}