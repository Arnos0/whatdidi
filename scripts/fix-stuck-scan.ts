import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function fixStuckScan() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log('Checking for stuck scan jobs...')
  
  // Get all scan jobs that are stuck in 'running' state
  const { data: stuckJobs, error } = await supabase
    .from('email_scan_jobs')
    .select('*')
    .eq('status', 'running')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching scan jobs:', error)
    return
  }
  
  if (!stuckJobs || stuckJobs.length === 0) {
    console.log('No stuck scan jobs found')
    return
  }
  
  console.log(`Found ${stuckJobs.length} stuck scan job(s)`)
  
  for (const job of stuckJobs) {
    console.log(`\nJob ${job.id}:`)
    console.log(`- Created: ${job.created_at}`)
    console.log(`- Started: ${job.started_at}`)
    console.log(`- Emails found: ${job.emails_found}`)
    console.log(`- Emails processed: ${job.emails_processed}`)
    console.log(`- Orders created: ${job.orders_created}`)
    console.log(`- Last error: ${job.last_error}`)
    
    // Calculate how long it's been running
    const startTime = new Date(job.started_at).getTime()
    const runningTime = Date.now() - startTime
    const runningMinutes = Math.floor(runningTime / 60000)
    
    console.log(`- Running for: ${runningMinutes} minutes`)
    
    // If it's been running for more than 5 minutes, mark it as failed
    if (runningMinutes > 5) {
      console.log('Marking job as failed (exceeded 5 minute timeout)')
      
      const { error: updateError } = await supabase
        .from('email_scan_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          last_error: `Job timed out after ${runningMinutes} minutes. Processed ${job.emails_processed}/${job.emails_found} emails.`
        })
        .eq('id', job.id)
      
      if (updateError) {
        console.error('Error updating job:', updateError)
      } else {
        console.log('Job marked as failed')
      }
    } else {
      console.log('Job is still within timeout period')
    }
  }
  
  // Also check for any 'pending' jobs that are old
  const { data: pendingJobs } = await supabase
    .from('email_scan_jobs')
    .select('*')
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 10 * 60000).toISOString()) // Older than 10 minutes
  
  if (pendingJobs && pendingJobs.length > 0) {
    console.log(`\nFound ${pendingJobs.length} old pending job(s)`)
    for (const job of pendingJobs) {
      const { error: updateError } = await supabase
        .from('email_scan_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          last_error: 'Job never started processing'
        })
        .eq('id', job.id)
      
      if (!updateError) {
        console.log(`Marked pending job ${job.id} as failed`)
      }
    }
  }
}

fixStuckScan().catch(console.error)