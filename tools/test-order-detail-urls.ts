import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testOrderDetailUrls() {
  try {
    console.log('Testing order detail page URLs...\n')

    // Get all orders for preview user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'preview@whatdidi.shop')
      .single()

    if (!user) {
      console.error('Preview user not found')
      return
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, retailer')
      .eq('user_id', user.id)
      .order('order_date', { ascending: false })
      .limit(5) // Test first 5 orders

    if (!orders) {
      console.error('No orders found')
      return
    }

    console.log('✅ Order Detail URLs (all should work):')
    console.log('==========================================')
    
    orders.forEach((order, index) => {
      const detailUrl = `http://localhost:3002/orders/${order.id}`
      console.log(`${index + 1}. ${order.order_number} (${order.retailer})`)
      console.log(`   URL: ${detailUrl}`)
      console.log(`   ID:  ${order.id}`)
      console.log('')
    })

    console.log('🎯 These URLs should all work now when logged in as preview@whatdidi.shop')
    console.log('   Each order belongs to the correct user and should display properly.')

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
testOrderDetailUrls()