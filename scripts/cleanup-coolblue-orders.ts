#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupCoolblueOrders() {
  console.log('🧹 Cleaning up Coolblue orders...\n')
  
  // First, find all Coolblue orders
  const { data: coolblueOrders, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('retailer', 'Coolblue')
    .order('created_at', { ascending: false })
  
  if (fetchError) {
    console.error('Error fetching Coolblue orders:', fetchError)
    return
  }
  
  if (!coolblueOrders || coolblueOrders.length === 0) {
    console.log('No Coolblue orders found in database.')
    return
  }
  
  console.log(`Found ${coolblueOrders.length} Coolblue orders:\n`)
  
  // Display orders
  coolblueOrders.forEach(order => {
    console.log(`Order #${order.order_number}`)
    console.log(`  - Amount: €${order.amount}`)
    console.log(`  - Status: ${order.status}`)
    console.log(`  - Order Date: ${new Date(order.order_date).toLocaleDateString()}`)
    console.log(`  - Created: ${new Date(order.created_at).toLocaleString()}`)
    console.log(`  - ID: ${order.id}`)
    console.log('')
  })
  
  // Ask for confirmation
  console.log('⚠️  WARNING: This will delete ALL Coolblue orders from the database.')
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Delete all Coolblue orders
  const { error: deleteError, count } = await supabase
    .from('orders')
    .delete()
    .eq('retailer', 'Coolblue')
  
  if (deleteError) {
    console.error('Error deleting orders:', deleteError)
    return
  }
  
  console.log(`✅ Successfully deleted ${coolblueOrders.length} Coolblue orders.`)
  
  // Also clean up processed_emails for Coolblue
  const { error: emailError, count: emailCount } = await supabase
    .from('processed_emails')
    .delete()
    .ilike('sender', '%coolblue%')
  
  if (!emailError) {
    console.log(`✅ Also cleaned up ${emailCount || 0} Coolblue entries from processed_emails.`)
  }
  
  console.log('\n🎉 Cleanup complete! You can now run a fresh scan.')
}

// Run the cleanup
cleanupCoolblueOrders().catch(console.error)