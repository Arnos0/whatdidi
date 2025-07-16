import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function debugCoolblue() {
  console.log('Debugging Coolblue emails...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // First check if we can access the table at all
  const { data: testAccess, error: accessError } = await supabase
    .from('processed_emails')
    .select('id')
    .limit(1)
  
  if (accessError) {
    console.error('Error accessing processed_emails table:', accessError)
    console.log('\nTrying to access email_scan_jobs instead...')
    
    const { data: scanJobs } = await supabase
      .from('email_scan_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('Recent scan jobs:', scanJobs?.length || 0)
    return
  }
  
  // First check total emails
  const { count: totalCount } = await supabase
    .from('processed_emails')
    .select('*', { count: 'exact', head: true })
  
  console.log(`Total processed emails in database: ${totalCount}`)
  
  // Get the most recent Coolblue emails from processed_emails
  const { data: coolblueEmails, error } = await supabase
    .from('processed_emails')
    .select('*')
    .or('sender.ilike.%coolblue%,subject.ilike.%coolblue%')
    .order('email_date', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching emails:', error)
    return
  }
  
  console.log(`Found ${coolblueEmails?.length || 0} Coolblue emails:\n`)
  
  coolblueEmails?.forEach((email, index) => {
    console.log(`${index + 1}. "${email.subject}"`)
    console.log(`   From: ${email.sender}`)
    console.log(`   Date: ${email.email_date}`)
    console.log(`   Gmail ID: ${email.gmail_message_id}`)
    console.log(`   Was analyzed: ${email.retailer_detected === 'Pending AI Analysis'}`)
    console.log(`   Order created: ${email.order_created}`)
    console.log(`   Parse error: ${email.parse_error}`)
    console.log(`   ---`)
  })
  
  // Get the actual order confirmation emails
  const orderConfirmations = coolblueEmails?.filter(e => 
    e.subject.includes('✅') || 
    e.subject.toLowerCase().includes('bestelling') ||
    e.subject.toLowerCase().includes('komt naar je toe')
  )
  
  console.log(`\nOrder confirmation emails: ${orderConfirmations?.length || 0}`)
  
  if (orderConfirmations && orderConfirmations.length > 0) {
    console.log('\nThese should have been detected as orders but were not.')
    console.log('The issue is likely that Gemini is not extracting the order data correctly.')
    console.log('\nPossible reasons:')
    console.log('1. The email HTML is too complex for Gemini to parse')
    console.log('2. The order number format is not being recognized')
    console.log('3. The amount is not being extracted properly')
    console.log('4. The email body is being truncated before reaching order details')
  }
}

debugCoolblue().catch(console.error)