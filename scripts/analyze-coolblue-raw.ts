#!/usr/bin/env npx tsx
import { createServerClient } from '../lib/supabase/server-client'

async function analyzeCoolblueEmails() {
  const supabase = createServerClient()
  
  // Find Coolblue emails in processed_emails
  const { data: coolblueEmails, error } = await supabase
    .from('processed_emails')
    .select('*')
    .ilike('sender', '%coolblue%')
    .order('email_date', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching emails:', error)
    return
  }
  
  console.log(`Found ${coolblueEmails?.length || 0} Coolblue emails in processed_emails\n`)
  
  if (!coolblueEmails || coolblueEmails.length === 0) {
    console.log('No Coolblue emails found')
    return
  }
  
  for (const email of coolblueEmails) {
    console.log('---')
    console.log(`Subject: ${email.subject}`)
    console.log(`From: ${email.sender}`)
    console.log(`Date: ${email.email_date}`)
    console.log(`Order created: ${email.order_created}`)
    console.log(`Parse error: ${email.parse_error || 'none'}`)
    console.log(`Gmail ID: ${email.gmail_message_id}`)
    
    if (email.order_id) {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', email.order_id)
        .single()
      
      if (order) {
        console.log(`Order found: ${order.order_number} - €${order.amount}`)
      }
    } else {
      console.log('No order created from this email')
      
      // Check if there's raw email data we can analyze
      const { data: orders } = await supabase
        .from('orders')
        .select('id, raw_email_data')
        .eq('retailer', 'Coolblue')
        .limit(1)
      
      if (orders && orders.length > 0 && orders[0].raw_email_data) {
        const rawEmail = orders[0].raw_email_data as any
        console.log('\nSample raw email structure:')
        console.log('- payload keys:', Object.keys(rawEmail.payload || {}))
        if (rawEmail.payload?.parts) {
          console.log('- parts:', rawEmail.payload.parts.length)
          rawEmail.payload.parts.forEach((part: any, i: number) => {
            console.log(`  Part ${i}: mimeType=${part.mimeType}, size=${part.body?.size || 0}`)
          })
        }
      }
    }
    console.log('')
  }
}

analyzeCoolblueEmails().catch(console.error)