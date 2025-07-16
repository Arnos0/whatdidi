#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrder() {
  // Check if order 90276634 from Coolblue exists
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', '90276634')
    .eq('retailer', 'Coolblue')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${orders?.length || 0} orders with number 90276634 from Coolblue`)
  
  if (orders && orders.length > 0) {
    console.log('\nExisting order details:')
    orders.forEach(order => {
      console.log(`- ID: ${order.id}`)
      console.log(`- User ID: ${order.user_id}`)
      console.log(`- Amount: €${order.amount}`)
      console.log(`- Status: ${order.status}`)
      console.log(`- Created: ${new Date(order.created_at).toLocaleString()}`)
    })
  }
  
  // Also check for any Coolblue orders
  const { data: allCoolblue } = await supabase
    .from('orders')
    .select('order_number, amount, created_at')
    .eq('retailer', 'Coolblue')
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log(`\nAll Coolblue orders:`)
  allCoolblue?.forEach(order => {
    console.log(`- ${order.order_number}: €${order.amount} (${new Date(order.created_at).toLocaleDateString()})`)
  })
}

checkOrder().catch(console.error)