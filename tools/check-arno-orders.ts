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

async function checkArnoOrders() {
  try {
    console.log('Checking orders for arno@wedevelop.nl...\n')

    // Find the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email')
      .eq('email', 'arno@wedevelop.nl')
      .single()

    if (userError || !user) {
      console.log('❌ User arno@wedevelop.nl not found:', userError?.message || 'No user found')
      return
    }

    console.log('✅ User found:')
    console.log(`- ID: ${user.id}`)
    console.log(`- Clerk ID: ${user.clerk_id}`)
    console.log(`- Email: ${user.email}\n`)

    // Get orders for this user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, retailer, amount, status, order_date')
      .eq('user_id', user.id)
      .order('order_date', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return
    }

    console.log(`Found ${orders?.length || 0} orders:`)
    if (orders && orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.order_number} - ${order.retailer} - €${order.amount}`)
        console.log(`   ID: ${order.id}`)
        console.log(`   Status: ${order.status}`)
        console.log(`   Date: ${order.order_date}`)
        console.log('')
      })
    } else {
      console.log('📭 No orders found for this user.')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
checkArnoOrders()