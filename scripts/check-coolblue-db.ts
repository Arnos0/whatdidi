#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCoolblueData() {
  // Check processed_emails for Coolblue
  const { data: emails, error: emailError } = await supabase
    .from('processed_emails')
    .select('*')
    .ilike('sender', '%coolblue%')
    .order('email_date', { ascending: false })
    .limit(10)
  
  console.log('=== Coolblue Emails in processed_emails ===')
  console.log(`Found: ${emails?.length || 0} emails\n`)
  
  if (emails) {
    for (const email of emails) {
      console.log(`Subject: "${email.subject}"`)
      console.log(`From: ${email.sender}`)
      console.log(`Date: ${new Date(email.email_date).toLocaleString()}`)
      console.log(`Order created: ${email.order_created}`)
      console.log(`Order ID: ${email.order_id || 'none'}`)
      console.log(`Parse error: ${email.parse_error || 'none'}`)
      console.log('---')
    }
  }
  
  // Check orders for Coolblue
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .ilike('retailer', '%coolblue%')
    .order('created_at', { ascending: false })
    .limit(10)
  
  console.log('\n=== Coolblue Orders ===')
  console.log(`Found: ${orders?.length || 0} orders\n`)
  
  if (orders) {
    for (const order of orders) {
      console.log(`Order: ${order.order_number}`)
      console.log(`Amount: €${order.amount}`)
      console.log(`Status: ${order.status}`)
      console.log(`Date: ${new Date(order.order_date).toLocaleDateString()}`)
      console.log(`Created: ${new Date(order.created_at).toLocaleString()}`)
      console.log('---')
    }
  }
  
  // Get one raw email to check structure
  if (orders && orders.length > 0 && orders[0].raw_email_data) {
    console.log('\n=== Sample Raw Email Structure ===')
    const raw = orders[0].raw_email_data as any
    console.log('Top level keys:', Object.keys(raw))
    if (raw.payload) {
      console.log('Payload keys:', Object.keys(raw.payload))
      if (raw.payload.headers) {
        const subject = raw.payload.headers.find((h: any) => h.name === 'Subject')
        const from = raw.payload.headers.find((h: any) => h.name === 'From')
        console.log('Subject from headers:', subject?.value)
        console.log('From from headers:', from?.value)
      }
      if (raw.payload.parts) {
        console.log('Parts:', raw.payload.parts.length)
        raw.payload.parts.forEach((part: any, i: number) => {
          console.log(`  Part ${i}: ${part.mimeType} (${part.body?.size || 0} bytes)`)
          if (part.parts) {
            part.parts.forEach((subpart: any, j: number) => {
              console.log(`    Subpart ${j}: ${subpart.mimeType} (${subpart.body?.size || 0} bytes)`)
            })
          }
        })
      }
    }
  }
}

// Load env and run
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Source .env.local first.')
  process.exit(1)
}

checkCoolblueData().catch(console.error)