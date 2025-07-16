import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testInsert() {
  console.log('Testing database insert...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // First, get an email account to use
  const { data: emailAccounts } = await supabase
    .from('email_accounts')
    .select('id, email')
    .limit(1)
  
  if (!emailAccounts || emailAccounts.length === 0) {
    console.log('No email accounts found')
    return
  }
  
  const emailAccount = emailAccounts[0]
  console.log(`Using email account: ${emailAccount.email} (${emailAccount.id})`)
  
  // Try to insert a test record
  const testRecord = {
    email_account_id: emailAccount.id,
    gmail_message_id: 'test-' + Date.now(),
    gmail_thread_id: 'test-thread',
    email_date: new Date().toISOString(),
    subject: 'Test Coolblue Email',
    sender: 'Coolblue <test@coolblue.nl>',
    retailer_detected: 'Pending AI Analysis',
    order_created: false,
    parse_error: null,
    processed_at: new Date().toISOString()
  }
  
  console.log('\nInserting test record...')
  const { data, error } = await supabase
    .from('processed_emails')
    .insert(testRecord)
    .select()
  
  if (error) {
    console.error('Insert error:', error)
  } else {
    console.log('Insert successful:', data)
  }
  
  // Check if we can read it back
  const { data: readBack, error: readError } = await supabase
    .from('processed_emails')
    .select('*')
    .eq('gmail_message_id', testRecord.gmail_message_id)
  
  if (readError) {
    console.error('Read error:', readError)
  } else {
    console.log('\nRead back:', readBack?.length || 0, 'records')
  }
  
  // Check total count
  const { count } = await supabase
    .from('processed_emails')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\nTotal records in processed_emails: ${count}`)
}

testInsert().catch(console.error)