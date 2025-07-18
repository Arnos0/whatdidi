import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixUserOrders() {
  console.log('🔧 Fixing user orders for arno@wedevelop.nl...')
  
  try {
    // Get both arno@wedevelop.nl users
    const { data: arnoUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'arno@wedevelop.nl')
      .order('created_at', { ascending: false })
    
    if (usersError || !arnoUsers || arnoUsers.length === 0) {
      console.error('❌ Error finding arno@wedevelop.nl users:', usersError)
      return
    }
    
    console.log(`👥 Found ${arnoUsers.length} users for arno@wedevelop.nl:`)
    arnoUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`)
      console.log(`     Clerk ID: ${user.clerk_id}`)
      console.log(`     Created: ${user.created_at}`)
      console.log('')
    })
    
    // Use the newer user (first in the list since we ordered by created_at desc)
    const targetUser = arnoUsers[0]
    console.log(`🎯 Using most recent user: ${targetUser.clerk_id}`)
    
    // Check current orders
    const { data: currentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', targetUser.id)
    
    if (ordersError) {
      console.error('❌ Error checking current orders:', ordersError)
      return
    }
    
    console.log(`📦 Current orders for target user: ${currentOrders?.length || 0}`)
    
    if (currentOrders && currentOrders.length > 0) {
      console.log('✅ User already has orders! No transfer needed.')
      return
    }
    
    // Transfer all orders to the target user
    const { data: allOrders, error: getAllError } = await supabase
      .from('orders')
      .select('*')
    
    if (getAllError) {
      console.error('❌ Error getting all orders:', getAllError)
      return
    }
    
    if (!allOrders || allOrders.length === 0) {
      console.log('📦 No orders found to transfer.')
      return
    }
    
    console.log(`🔄 Transferring ${allOrders.length} orders to ${targetUser.clerk_id}...`)
    
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ user_id: targetUser.id })
      .neq('user_id', targetUser.id)
      .select('*')
    
    if (updateError) {
      console.error('❌ Error updating orders:', updateError)
      return
    }
    
    console.log(`✅ Successfully transferred ${updatedOrders?.length || 0} orders!`)
    
    // Verify final state
    const { data: finalOrders, error: verifyError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', targetUser.id)
    
    if (verifyError) {
      console.error('❌ Error verifying final state:', verifyError)
      return
    }
    
    console.log(`\n🎉 Final result: ${finalOrders?.length || 0} orders for ${targetUser.clerk_id}`)
    console.log(`💰 Total value: €${finalOrders?.reduce((sum, order) => sum + Number(order.amount), 0).toFixed(2) || '0.00'}`)
    
    if (finalOrders && finalOrders.length > 0) {
      console.log('\n📋 Orders summary:')
      const statusCounts = finalOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`)
      })
    }
    
  } catch (error) {
    console.error('💥 Fix error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  fixUserOrders()
}

export { fixUserOrders }