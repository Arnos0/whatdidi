import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkCoolblueOrder() {
  console.log('Checking Coolblue order status...\n')

  // Find Coolblue orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .or('retailer.eq.Coolblue,order_number.eq.90276634')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return
  }

  console.log(`Found ${orders?.length || 0} Coolblue orders:\n`)

  for (const order of orders || []) {
    console.log(`Order ID: ${order.id}`)
    console.log(`Order Number: ${order.order_number}`)
    console.log(`Amount: EUR ${order.amount}`)
    console.log(`Status: ${order.status}`)
    console.log(`Tracking Number: ${order.tracking_number || 'None'}`)
    console.log(`Carrier: ${order.carrier || 'None'}`)
    console.log(`Order Date: ${order.order_date}`)
    console.log(`Created At: ${order.created_at}`)
    console.log(`Updated At: ${order.updated_at}`)

    // Check order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    if (itemsError) {
      console.error('Error fetching items:', itemsError)
    } else {
      console.log(`\nOrder Items (${items?.length || 0}):`)
      for (const item of items || []) {
        console.log(`  - ${item.description} (Qty: ${item.quantity}, Price: EUR ${item.price})`)
      }
    }
    console.log('\n---\n')
  }

  // Check for DHL emails
  console.log('Checking DHL emails...\n')
  const { data: dhlEmails } = await supabase
    .from('processed_emails')
    .select('*')
    .or('sender.ilike.%dhl%,subject.ilike.%JVGL%')
    .order('email_date', { ascending: false })
    .limit(5)

  console.log(`Found ${dhlEmails?.length || 0} DHL-related emails:`)
  for (const email of dhlEmails || []) {
    console.log(`  - "${email.subject}" from ${email.sender} on ${email.email_date}`)
    console.log(`    Order created: ${email.order_created}, Order ID: ${email.order_id || 'None'}`)
  }
}

checkCoolblueOrder().catch(console.error)