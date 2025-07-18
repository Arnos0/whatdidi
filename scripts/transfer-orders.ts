import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function transferOrders() {
  console.log('🔄 Transferring orders to real user...')
  
  try {
    // Get the target user (most recent real user)
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'arno@wedevelop.nl')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (userError || !targetUser) {
      console.error('❌ Error finding target user:', userError)
      return
    }
    
    console.log(`🎯 Target user: ${targetUser.email} (${targetUser.clerk_id})`)
    console.log(`📅 User created: ${targetUser.created_at}`)
    
    // Update all orders to belong to the target user
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ user_id: targetUser.id })
      .neq('user_id', targetUser.id) // Only update orders not already owned by target user
      .select('*')
    
    if (updateError) {
      console.error('❌ Error updating orders:', updateError)
      return
    }
    
    console.log(`✅ Successfully transferred ${updatedOrders?.length || 0} orders!`)
    
    if (updatedOrders && updatedOrders.length > 0) {
      console.log('\n📦 Transferred orders:')
      updatedOrders.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.retailer} - ${order.order_number} (${order.status})`)
      })
    }
    
    // Verify the transfer
    const { data: userOrders, error: verifyError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', targetUser.id)
    
    if (verifyError) {
      console.error('❌ Error verifying transfer:', verifyError)
      return
    }
    
    console.log(`\n🎉 ${targetUser.email} now has ${userOrders?.length || 0} orders!`)
    console.log(`💰 Total value: €${userOrders?.reduce((sum, order) => sum + Number(order.amount), 0).toFixed(2) || '0.00'}`)
    
  } catch (error) {
    console.error('💥 Transfer error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  transferOrders()
}

export { transferOrders }