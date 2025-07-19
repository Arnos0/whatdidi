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

async function checkTestData() {
  try {
    console.log('Checking test account data...\n')

    // Check all users with preview email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'preview@whatdidi.shop')

    if (userError) {
      console.error('Error fetching users:', userError)
      return
    }

    console.log(`Found ${users?.length || 0} users with email preview@whatdidi.shop:`)
    users?.forEach(user => {
      console.log(`- ID: ${user.id}`)
      console.log(`  Clerk ID: ${user.clerk_id}`)
      console.log(`  Created: ${user.created_at}\n`)
    })

    // Check orders for these users
    if (users && users.length > 0) {
      for (const user of users) {
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select('id, order_number, retailer, amount, status')
          .eq('user_id', user.id)

        console.log(`Orders for user ${user.id}: ${orders?.length || 0}`)
        if (orders && orders.length > 0) {
          orders.slice(0, 3).forEach(order => {
            console.log(`  - ${order.order_number} from ${order.retailer} (${order.status})`)
          })
          if (orders.length > 3) {
            console.log(`  ... and ${orders.length - 3} more orders`)
          }
        }
      }
    }

    // Check if there are any orders without users
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('user_id, count')
      .limit(20)

    console.log(`\nTotal orders in database: ${allOrders?.length || 0}`)

  } catch (error) {
    console.error('Error checking test data:', error)
  }
}

// Run the script
checkTestData()