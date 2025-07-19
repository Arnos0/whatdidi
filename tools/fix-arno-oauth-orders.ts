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

async function fixArnoOAuthOrders() {
  try {
    console.log('Fixing orders for OAuth user arno@wedevelop.nl...\n')

    // The OAuth user ID from the logs
    const oauthUserId = 'f53e0414-1918-45f5-abee-ef7ec89aa2df'
    const oldUserId = 'f1736111-9b80-440f-97cf-020c563a5020'

    console.log(`Moving orders from ${oldUserId} to ${oauthUserId}`)

    // 1. Check current orders for OAuth user
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('id, order_number, retailer, amount')
      .eq('user_id', oauthUserId)

    console.log(`OAuth user currently has ${currentOrders?.length || 0} orders`)

    // 2. Get orders from the old user
    const { data: ordersToMove } = await supabase
      .from('orders')
      .select('id, order_number, retailer, amount')
      .eq('user_id', oldUserId)

    console.log(`Found ${ordersToMove?.length || 0} orders to move from old user`)

    if (ordersToMove && ordersToMove.length > 0) {
      // 3. Move the orders
      const { data: movedOrders, error: moveError } = await supabase
        .from('orders')
        .update({ user_id: oauthUserId })
        .eq('user_id', oldUserId)
        .select()

      if (moveError) {
        console.error('Error moving orders:', moveError)
        return
      }

      console.log(`✅ Successfully moved ${movedOrders?.length || 0} orders`)

      // 4. Delete the old user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', oldUserId)

      if (deleteError) {
        console.error('Error deleting old user:', deleteError)
      } else {
        console.log('✅ Deleted old user')
      }

      // 5. Verify final state
      const { data: finalOrders } = await supabase
        .from('orders')
        .select('order_number, retailer, amount, status')
        .eq('user_id', oauthUserId)
        .order('order_date', { ascending: false })

      console.log(`\n✅ OAuth user now has ${finalOrders?.length || 0} orders:`)
      if (finalOrders) {
        finalOrders.forEach((order, index) => {
          console.log(`${index + 1}. ${order.order_number} - ${order.retailer} - €${order.amount} (${order.status})`)
        })
      }
    } else {
      console.log('No orders found to move')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
fixArnoOAuthOrders()