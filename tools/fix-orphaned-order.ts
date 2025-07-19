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

async function fixOrphanedOrder() {
  try {
    console.log('Fixing orphaned order...\n')

    // Find the preview user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'preview@whatdidi.shop')
      .single()

    if (userError || !user) {
      console.error('Preview user not found:', userError)
      return
    }

    console.log('Preview user ID:', user.id)

    // Update the orphaned order
    const orphanedOrderId = '139a53a0-b26a-42b3-ba76-f4fee2cbde68'
    
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ user_id: user.id })
      .eq('id', orphanedOrderId)
      .select()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return
    }

    console.log('✅ Successfully updated order:', updatedOrder[0]?.order_number)

    // Also update any order items for this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orphanedOrderId)

    if (itemsError) {
      console.error('Error checking order items:', itemsError)
    } else {
      console.log(`Found ${orderItems?.length || 0} order items for this order`)
    }

    // Delete any orphaned users that don't have orders anymore
    const { data: orphanedUsers, error: orphanError } = await supabase
      .from('users')
      .select('id, email')
      .neq('email', 'preview@whatdidi.shop')

    if (orphanedUsers) {
      for (const orphanUser of orphanedUsers) {
        const { data: userOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', orphanUser.id)

        if (!userOrders || userOrders.length === 0) {
          console.log(`Deleting orphaned user: ${orphanUser.email || orphanUser.id}`)
          await supabase
            .from('users')
            .delete()
            .eq('id', orphanUser.id)
        }
      }
    }

    console.log('\n✅ Cleanup complete!')

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
fixOrphanedOrder()