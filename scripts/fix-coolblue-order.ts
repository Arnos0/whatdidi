import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixCoolblueOrder() {
  console.log('Fixing Coolblue order...\n')

  // Find the corrupted order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('retailer', 'Coolblue')
    .eq('order_number', '0')
    .eq('amount', 85)
    .single()

  if (error || !order) {
    console.error('Could not find the corrupted order:', error)
    return
  }

  console.log(`Found corrupted order: ${order.id}`)
  console.log(`Current order number: ${order.order_number}`)
  
  // Fix the order number
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      order_number: '90276634',
      updated_at: new Date().toISOString()
    })
    .eq('id', order.id)

  if (updateError) {
    console.error('Failed to update order:', updateError)
    return
  }

  console.log('✅ Fixed order number to 90276634')

  // Add the missing order item
  const { error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: order.id,
      description: 'Logitech MX Master 3S Grafiet',
      quantity: 1,
      price: 85.00
    })

  if (itemError) {
    console.error('Failed to add order item:', itemError)
  } else {
    console.log('✅ Added missing order item')
  }

  // Now process the DHL emails
  console.log('\nLinking DHL tracking...')
  
  // Update with DHL tracking info
  const { error: trackingError } = await supabase
    .from('orders')
    .update({
      tracking_number: 'JVGL0624229100530651',
      carrier: 'DHL',
      status: 'delivered',
      updated_at: new Date().toISOString()
    })
    .eq('id', order.id)

  if (trackingError) {
    console.error('Failed to update tracking:', trackingError)
  } else {
    console.log('✅ Added DHL tracking number and updated status to delivered')
  }

  console.log('\n✅ Order fixed successfully!')
}

fixCoolblueOrder().catch(console.error)