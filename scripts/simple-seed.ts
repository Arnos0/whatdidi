import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simpleSeed() {
  console.log('🌱 Simple seed: Adding orders to BOTH arno@wedevelop.nl users...')
  
  try {
    // Get both arno@wedevelop.nl users
    const { data: arnoUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'arno@wedevelop.nl')
    
    if (usersError || !arnoUsers || arnoUsers.length === 0) {
      console.error('❌ Error finding users:', usersError)
      return
    }
    
    console.log(`👥 Found ${arnoUsers.length} users for arno@wedevelop.nl`)
    
    // Clear existing orders for both users
    for (const user of arnoUsers) {
      console.log(`🧹 Clearing orders for user: ${user.clerk_id}`)
      
      await supabase
        .from('order_items')
        .delete()
        .in('order_id', (await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
        ).data?.map(o => o.id) || [])
      
      await supabase
        .from('orders')
        .delete()
        .eq('user_id', user.id)
    }
    
    // Create orders for BOTH users
    for (const user of arnoUsers) {
      console.log(`📦 Creating orders for user: ${user.clerk_id}`)
      
      const sampleOrders = [
        {
          order_number: 'BOL-1234567890',
          retailer: 'Bol.com',
          amount: 349.99,
          currency: 'EUR',
          status: 'delivered',
          tracking_number: 'RR123456789NL',
          carrier: 'postnl',
          order_date: '2025-01-15',
          is_manual: false,
          items: [
            { description: 'Samsung Galaxy Buds2 Pro - Draadloze oordopjes', quantity: 1, price: 199.99 },
            { description: 'Spigen Clear Case - Galaxy S24', quantity: 1, price: 24.99 },
            { description: 'USB-C naar Lightning kabel 2m', quantity: 2, price: 62.50 }
          ]
        },
        {
          order_number: 'CB-2024010156',
          retailer: 'Coolblue',
          amount: 1299.00,
          currency: 'EUR',
          status: 'delivered',
          tracking_number: 'DHL-JVGL0624229100530651',
          carrier: 'dhl',
          order_date: '2025-01-10',
          is_manual: false,
          items: [
            { description: 'Apple MacBook Air 13" M2 - 256GB Middernacht', quantity: 1, price: 1299.00 }
          ]
        },
        {
          order_number: 'ZAL-789012345',
          retailer: 'Zalando',
          amount: 189.95,
          currency: 'EUR',
          status: 'shipped',
          order_date: '2025-01-08',
          is_manual: false,
          items: [
            { description: 'Nike Air Max 270 - Sneakers laag - Maat 42', quantity: 1, price: 149.95 },
            { description: 'Nike Sportswear - T-shirt basic - Zwart', quantity: 2, price: 20.00 }
          ]
        }
      ]
      
      for (const orderData of sampleOrders) {
        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            order_number: orderData.order_number + '-' + user.clerk_id.slice(-6), // Make unique
            retailer: orderData.retailer,
            amount: orderData.amount,
            currency: orderData.currency,
            status: orderData.status,
            tracking_number: orderData.tracking_number,
            carrier: orderData.carrier,
            order_date: orderData.order_date,
            is_manual: orderData.is_manual
          })
          .select('id')
          .single()
        
        if (orderError) {
          console.error(`❌ Error creating order ${orderData.order_number}:`, orderError)
          continue
        }
        
        // Create order items
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          description: item.description,
          quantity: item.quantity,
          price: item.price
        }))
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)
        
        if (itemsError) {
          console.error(`❌ Error creating items for ${orderData.order_number}:`, itemsError)
        } else {
          console.log(`✅ Created: ${orderData.retailer} - ${orderData.order_number} for ${user.clerk_id}`)
        }
      }
    }
    
    console.log(`\n🎉 Created orders for all users!`)
    console.log('🔄 Now refresh your browser to see orders')
    
  } catch (error) {
    console.error('💥 Simple seed error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  simpleSeed()
}

export { simpleSeed }