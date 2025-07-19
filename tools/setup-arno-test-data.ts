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

async function setupArnoTestData() {
  try {
    console.log('Setting up test data for arno@wedevelop.nl...\n')

    // Use the newer user ID
    const targetUserId = 'f1736111-9b80-440f-97cf-020c563a5020'
    const oldUserId = '29a26c0b-8e90-4293-9150-e984a5cfdf66'

    // 1. Move orders from old user to new user
    console.log('1. Moving orders from old user to new user...')
    const { data: movedOrders, error: moveError } = await supabase
      .from('orders')
      .update({ user_id: targetUserId })
      .eq('user_id', oldUserId)
      .select()

    if (moveError) {
      console.error('Error moving orders:', moveError)
    } else {
      console.log(`✅ Moved ${movedOrders?.length || 0} orders`)
    }

    // 2. Delete the old user
    console.log('\n2. Cleaning up old user...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', oldUserId)

    if (deleteError) {
      console.error('Error deleting old user:', deleteError)
    } else {
      console.log('✅ Deleted old user')
    }

    // 3. Add 7 new diverse test orders
    console.log('\n3. Adding 7 new test orders...')
    
    const testOrders = [
      {
        user_id: targetUserId,
        order_number: 'AH-2024071901-LXz0mB',
        retailer: 'Albert Heijn',
        amount: 89.45,
        currency: '€',
        status: 'delivered',
        order_date: '2024-07-19',
        tracking_number: 'AH123456789NL',
        carrier: 'ah_delivery'
      },
      {
        user_id: targetUserId,
        order_number: 'AMZ-2024071902-LXz0mB',
        retailer: 'Amazon',
        amount: 234.99,
        currency: '€',
        status: 'shipped',
        order_date: '2024-07-18',
        tracking_number: 'AMZ987654321',
        carrier: 'dhl',
        estimated_delivery: '2024-07-21'
      },
      {
        user_id: targetUserId,
        order_number: 'MED-2024071903-LXz0mB',
        retailer: 'MediaMarkt',
        amount: 899.00,
        currency: '€',
        status: 'processing',
        order_date: '2024-07-17'
      },
      {
        user_id: targetUserId,
        order_number: 'HM-2024071904-LXz0mB',
        retailer: 'H&M',
        amount: 67.50,
        currency: '€',
        status: 'delivered',
        order_date: '2024-07-16',
        tracking_number: 'HM456789123',
        carrier: 'postnl'
      },
      {
        user_id: targetUserId,
        order_number: 'IKEA-2024071905-LXz0mB',
        retailer: 'IKEA',
        amount: 445.75,
        currency: '€',
        status: 'pending',
        order_date: '2024-07-15'
      },
      {
        user_id: targetUserId,
        order_number: 'WHM-2024071906-LXz0mB',
        retailer: 'Wehkamp',
        amount: 156.20,
        currency: '€',
        status: 'shipped',
        order_date: '2024-07-14',
        tracking_number: 'WHM789456123',
        carrier: 'dpd'
      },
      {
        user_id: targetUserId,
        order_number: 'JT-2024071907-LXz0mB',
        retailer: 'Jumbo',
        amount: 45.80,
        currency: '€',
        status: 'delivered',
        order_date: '2024-07-13',
        tracking_number: 'JT321654987',
        carrier: 'jumbo_delivery'
      }
    ]

    for (const order of testOrders) {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single()

      if (orderError) {
        console.error(`Error creating order ${order.order_number}:`, orderError)
        continue
      }

      console.log(`✅ Created order: ${order.order_number} - ${order.retailer} (€${order.amount})`)

      // Add some order items for each order
      const orderItems = []
      
      if (order.retailer === 'Albert Heijn' || order.retailer === 'Jumbo') {
        orderItems.push(
          { order_id: newOrder.id, description: 'Organic Bananas', quantity: 2, price: 3.45 },
          { order_id: newOrder.id, description: 'Free Range Eggs (12 pack)', quantity: 1, price: 4.99 },
          { order_id: newOrder.id, description: 'Whole Wheat Bread', quantity: 2, price: 2.85 }
        )
      } else if (order.retailer === 'Amazon') {
        orderItems.push(
          { order_id: newOrder.id, description: 'Wireless Headphones', quantity: 1, price: 129.99 },
          { order_id: newOrder.id, description: 'USB-C Cable', quantity: 2, price: 15.99 },
          { order_id: newOrder.id, description: 'Phone Case', quantity: 1, price: 24.99 }
        )
      } else if (order.retailer === 'MediaMarkt') {
        orderItems.push(
          { order_id: newOrder.id, description: 'Gaming Monitor 27"', quantity: 1, price: 299.00 },
          { order_id: newOrder.id, description: 'Wireless Mouse', quantity: 1, price: 89.99 },
          { order_id: newOrder.id, description: 'Keyboard RGB', quantity: 1, price: 149.99 }
        )
      } else if (order.retailer === 'H&M') {
        orderItems.push(
          { order_id: newOrder.id, description: 'Cotton T-Shirt', quantity: 2, price: 12.99 },
          { order_id: newOrder.id, description: 'Jeans Regular Fit', quantity: 1, price: 39.99 }
        )
      } else if (order.retailer === 'IKEA') {
        orderItems.push(
          { order_id: newOrder.id, description: 'BILLY Bookcase', quantity: 1, price: 149.00 },
          { order_id: newOrder.id, description: 'POÄNG Armchair', quantity: 1, price: 129.00 },
          { order_id: newOrder.id, description: 'LACK Side Table', quantity: 2, price: 24.95 }
        )
      } else if (order.retailer === 'Wehkamp') {
        orderItems.push(
          { order_id: newOrder.id, description: 'Winter Jacket', quantity: 1, price: 89.99 },
          { order_id: newOrder.id, description: 'Wool Scarf', quantity: 1, price: 29.95 },
          { order_id: newOrder.id, description: 'Leather Gloves', quantity: 1, price: 34.99 }
        )
      }

      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error(`Error adding items for ${order.order_number}:`, itemsError)
        }
      }
    }

    // 4. Check final state
    console.log('\n4. Final check - All orders for arno@wedevelop.nl:')
    const { data: allOrders } = await supabase
      .from('orders')
      .select('order_number, retailer, amount, status, order_date')
      .eq('user_id', targetUserId)
      .order('order_date', { ascending: false })

    if (allOrders) {
      allOrders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.order_number} - ${order.retailer} - €${order.amount} (${order.status})`)
      })
      console.log(`\n✅ Total orders: ${allOrders.length}`)
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
setupArnoTestData()