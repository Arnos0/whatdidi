import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugUserOrders() {
  console.log('🔍 Debugging user and orders...')
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`👥 Found ${users?.length || 0} users:`)
    users?.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`)
      console.log(`     Clerk ID: ${user.clerk_id}`)
      console.log(`     Email: ${user.email}`)
      console.log(`     Created: ${user.created_at}`)
      console.log('')
    })
    
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      return
    }
    
    console.log(`📦 Found ${orders?.length || 0} orders:`)
    orders?.forEach((order, index) => {
      console.log(`  ${index + 1}. ${order.retailer} - ${order.order_number}`)
      console.log(`     User ID: ${order.user_id}`)
      console.log(`     Amount: ${order.currency} ${order.amount}`)
      console.log(`     Status: ${order.status}`)
      console.log('')
    })
    
    // Check order ownership
    if (users && orders) {
      console.log('🔗 Order ownership analysis:')
      users.forEach(user => {
        const userOrders = orders.filter(order => order.user_id === user.id)
        console.log(`  User ${user.email} (${user.clerk_id}): ${userOrders.length} orders`)
      })
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  debugUserOrders()
}

export { debugUserOrders }