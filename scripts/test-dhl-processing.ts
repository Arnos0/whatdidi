import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testDHLProcessing() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log('Testing DHL tracking processing logic...')
  console.log('Tracking number: DHL-JVGL0624229100530651')
  
  // Test user ID (replace with actual user ID from your database)
  const testUserId = '29a26c0b-8e90-4293-9150-e984a5cfdf66' // Update this with your actual user ID
  const trackingNumber = 'DHL-JVGL0624229100530651'
  
  console.log('\n=== Step 1: Test finding order by tracking number ===')
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, retailer, tracking_number')
      .eq('user_id', testUserId)
      .eq('tracking_number', trackingNumber)
      .maybeSingle()
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Result:', data ? 'Found existing order' : 'No existing order')
      if (data) {
        console.log('Order:', data)
      }
    }
  } catch (error) {
    console.error('Query failed:', error)
  }
  
  console.log('\n=== Step 2: Test finding recent orders without tracking ===')
  try {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    console.log('Searching from:', twoWeeksAgo)
    
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select('id, order_number, retailer, tracking_number, order_date')
      .eq('user_id', testUserId)
      .is('tracking_number', null)
      .in('status', ['pending', 'processing', 'confirmed'])
      .gte('order_date', twoWeeksAgo)
      .order('order_date', { ascending: false })
      .limit(5)
    
    if (recentOrdersError) {
      console.error('Error:', recentOrdersError)
    } else {
      console.log(`Found ${recentOrders?.length || 0} recent orders without tracking:`)
      recentOrders?.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.order_number} - ${order.retailer} (${order.order_date})`)
      })
    }
  } catch (error) {
    console.error('Query failed:', error)
  }
  
  console.log('\n=== Step 3: Test query performance ===')
  console.log('Testing for potential slow queries...')
  
  // Test if there are any orders with duplicate tracking numbers
  console.log('\n--- Checking for duplicate tracking numbers ---')
  try {
    const { data: duplicates, error } = await supabase
      .from('orders')
      .select('tracking_number, count(*)')
      .eq('user_id', testUserId)
      .not('tracking_number', 'is', null)
      .group('tracking_number')
      .having('count(*) > 1')
    
    if (error) {
      console.error('Error checking duplicates:', error)
    } else {
      console.log('Duplicate tracking numbers:', duplicates?.length || 0)
    }
  } catch (error) {
    console.error('Duplicate check failed:', error)
  }
  
  // Test if there are many orders for this user (which could slow down queries)
  console.log('\n--- Checking total order count ---')
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', testUserId)
    
    if (error) {
      console.error('Error getting count:', error)
    } else {
      console.log('Total orders for user:', count)
    }
  } catch (error) {
    console.error('Count query failed:', error)
  }
  
  console.log('\n=== Test completed ===')
}

testDHLProcessing().catch(console.error)