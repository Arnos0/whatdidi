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

async function checkPreviewOrders() {
  try {
    console.log('Checking orders for preview user...\n')

    // Find the preview user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email')
      .eq('email', 'preview@whatdidi.shop')
      .single()

    if (userError || !user) {
      console.error('Preview user not found:', userError)
      return
    }

    console.log('Preview user found:')
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
    orders?.forEach((order, index) => {
      console.log(`${index + 1}. ${order.order_number} - ${order.retailer} - €${order.amount}`)
      console.log(`   ID: ${order.id}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Date: ${order.order_date}`)
      console.log('')
    })

    // Test specific order ID that was failing
    const testOrderId = '139a53a0-b26a-42b3-ba76-f4fee2cbde68'
    const { data: testOrder, error: testError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', testOrderId)
      .single()

    console.log(`Test order ${testOrderId}:`)
    if (testError) {
      console.log('Error:', testError.message)
    } else {
      console.log('Found:', testOrder ? 'Yes' : 'No')
      if (testOrder) {
        console.log(`User ID: ${testOrder.user_id}`)
        console.log(`Order: ${testOrder.order_number} - ${testOrder.retailer}`)
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
checkPreviewOrders()