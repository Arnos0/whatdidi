import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test user ID (replace with your actual user ID)
const TEST_USER_ID = 'user_2r8XqO9JRqJYzqLKQXJHQWdPrCE' // Update this with your Clerk user ID

interface TestOrder {
  order_number: string
  retailer: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  tracking_number?: string
  carrier?: string
  order_date: string
  estimated_delivery?: string
  is_manual: boolean
  needs_review?: boolean
  items: Array<{
    description: string
    quantity: number
    price: number
  }>
}

const testOrders: TestOrder[] = [
  // Bol.com orders (Dutch)
  {
    order_number: 'BOL-1234567890',
    retailer: 'Bol.com',
    amount: 349.99,
    currency: 'EUR',
    status: 'delivered',
    tracking_number: 'RR123456789NL',
    carrier: 'postnl',
    order_date: '2025-01-15',
    estimated_delivery: '2025-01-17',
    is_manual: false,
    items: [
      { description: 'Samsung Galaxy Buds2 Pro - Draadloze oordopjes', quantity: 1, price: 199.99 },
      { description: 'Spigen Clear Case - Galaxy S24', quantity: 1, price: 24.99 },
      { description: 'USB-C naar Lightning kabel 2m', quantity: 2, price: 62.50 }
    ]
  },
  {
    order_number: 'BOL-0987654321',
    retailer: 'Bol.com',
    amount: 47.98,
    currency: 'EUR',
    status: 'shipped',
    tracking_number: 'RR987654321NL',
    carrier: 'postnl',
    order_date: '2025-01-16',
    estimated_delivery: '2025-01-19',
    is_manual: false,
    items: [
      { description: 'Atomic Habits - James Clear (Nederlandse editie)', quantity: 1, price: 22.99 },
      { description: 'Het Grote Kookboek van Yvette van Boven', quantity: 1, price: 24.99 }
    ]
  },
  {
    order_number: 'BOL-5678901234',
    retailer: 'Bol.com',
    amount: 156.47,
    currency: 'EUR',
    status: 'processing',
    order_date: '2025-01-17',
    estimated_delivery: '2025-01-20',
    is_manual: false,
    items: [
      { description: 'Philips Hue White and Color E27 3-pack', quantity: 1, price: 119.99 },
      { description: 'Philips Hue Bridge 2.0', quantity: 1, price: 36.48 }
    ]
  },

  // Coolblue orders (Dutch tech focus)
  {
    order_number: 'CB-2024010156',
    retailer: 'Coolblue',
    amount: 1299.00,
    currency: 'EUR',
    status: 'delivered',
    tracking_number: 'DHL-JVGL0624229100530651',
    carrier: 'dhl',
    order_date: '2025-01-10',
    estimated_delivery: '2025-01-12',
    is_manual: false,
    items: [
      { description: 'Apple MacBook Air 13" M2 - 256GB Middernacht', quantity: 1, price: 1299.00 }
    ]
  },
  {
    order_number: 'CB-2024010189',
    retailer: 'Coolblue',
    amount: 245.98,
    currency: 'EUR',
    status: 'shipped',
    tracking_number: 'DHL-JVGL0624229100530652',
    carrier: 'dhl',
    order_date: '2025-01-14',
    estimated_delivery: '2025-01-18',
    is_manual: false,
    items: [
      { description: 'Sony WH-1000XM5 Draadloze koptelefoon - Zwart', quantity: 1, price: 229.00 },
      { description: 'Belkin USB-C naar USB-C kabel 1m', quantity: 1, price: 16.98 }
    ]
  },

  // Zalando orders (Dutch fashion)
  {
    order_number: 'ZAL-789012345',
    retailer: 'Zalando',
    amount: 189.95,
    currency: 'EUR',
    status: 'delivered',
    tracking_number: 'RR456789123NL',
    carrier: 'postnl',
    order_date: '2025-01-08',
    estimated_delivery: '2025-01-11',
    is_manual: false,
    items: [
      { description: 'Nike Air Max 270 - Sneakers laag - Maat 42', quantity: 1, price: 149.95 },
      { description: 'Nike Sportswear - T-shirt basic - Zwart', quantity: 2, price: 20.00 }
    ]
  },
  {
    order_number: 'ZAL-345678901',
    retailer: 'Zalando',
    amount: 127.96,
    currency: 'EUR',
    status: 'pending',
    order_date: '2025-01-17',
    estimated_delivery: '2025-01-21',
    is_manual: false,
    items: [
      { description: 'Levi\'s 511 SLIM - Slim fit jeans - Blauw', quantity: 1, price: 79.99 },
      { description: 'Tommy Hilfiger CORE CREW NECK - Trui - Navy', quantity: 1, price: 47.97 }
    ]
  },

  // Amazon orders (English)
  {
    order_number: 'AMZ-171-1234567-8901234',
    retailer: 'Amazon',
    amount: 89.97,
    currency: 'EUR',
    status: 'delivered',
    tracking_number: 'TBA123456789',
    carrier: 'amazon',
    order_date: '2025-01-12',
    estimated_delivery: '2025-01-14',
    is_manual: false,
    items: [
      { description: 'Anker PowerCore 10000 Portable Charger', quantity: 1, price: 24.99 },
      { description: 'Echo Dot (5th Gen) Smart Speaker with Alexa', quantity: 1, price: 54.99 },
      { description: 'Amazon Basics Lightning to USB-A Cable - 6 feet', quantity: 1, price: 9.99 }
    ]
  },
  {
    order_number: 'AMZ-171-9876543-2109876',
    retailer: 'Amazon',
    amount: 156.49,
    currency: 'EUR',
    status: 'shipped',
    tracking_number: 'TBA987654321',
    carrier: 'amazon',
    order_date: '2025-01-15',
    estimated_delivery: '2025-01-19',
    is_manual: false,
    items: [
      { description: 'Kindle Paperwhite (11th generation) - 6.8" display', quantity: 1, price: 139.99 },
      { description: 'Amazon Kindle Fabric Cover - Charcoal Black', quantity: 1, price: 16.50 }
    ]
  },

  // Manual orders (mixed)
  {
    order_number: 'MANUAL-001',
    retailer: 'Albert Heijn',
    amount: 73.42,
    currency: 'EUR',
    status: 'delivered',
    order_date: '2025-01-16',
    is_manual: true,
    items: [
      { description: 'Weekboodschappen - Diverse producten', quantity: 1, price: 73.42 }
    ]
  },
  {
    order_number: 'MANUAL-002',
    retailer: 'MediaMarkt',
    amount: 199.00,
    currency: 'EUR',
    status: 'delivered',
    order_date: '2025-01-13',
    is_manual: true,
    items: [
      { description: 'Nintendo Switch Game - The Legend of Zelda', quantity: 1, price: 59.99 },
      { description: 'SanDisk microSD 128GB voor Nintendo Switch', quantity: 1, price: 24.99 },
      { description: 'Pro Controller voor Nintendo Switch', quantity: 1, price: 69.99 },
      { description: 'Switch Carrying Case', quantity: 1, price: 44.03 }
    ]
  }
]

async function getUserId(): Promise<string> {
  // Try to get user from database first
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .limit(1)
  
  if (error) {
    console.error('Error fetching users:', error)
    process.exit(1)
  }
  
  if (users && users.length > 0) {
    return users[0].id
  }
  
  console.error('No users found in database. Please sign up first at http://localhost:3002')
  process.exit(1)
}

async function seedTestData() {
  console.log('🌱 Starting test data seeding...')
  
  try {
    // Get actual user ID from database
    const userId = await getUserId()
    console.log(`📧 Using user ID: ${userId}`)
    
    // Clear existing test orders (optional)
    console.log('🧹 Clearing existing orders...')
    await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    console.log('📦 Creating test orders...')
    
    for (const testOrder of testOrders) {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          order_number: testOrder.order_number,
          retailer: testOrder.retailer,
          amount: testOrder.amount,
          currency: testOrder.currency,
          status: testOrder.status,
          tracking_number: testOrder.tracking_number,
          carrier: testOrder.carrier,
          order_date: testOrder.order_date,
          estimated_delivery: testOrder.estimated_delivery,
          is_manual: testOrder.is_manual,
          needs_review: testOrder.needs_review || false
        })
        .select('id')
        .single()
      
      if (orderError) {
        console.error(`❌ Error creating order ${testOrder.order_number}:`, orderError)
        continue
      }
      
      // Create order items
      const orderItems = testOrder.items.map(item => ({
        order_id: order.id,
        description: item.description,
        quantity: item.quantity,
        price: item.price
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) {
        console.error(`❌ Error creating items for order ${testOrder.order_number}:`, itemsError)
        continue
      }
      
      console.log(`✅ Created order: ${testOrder.retailer} - ${testOrder.order_number} (${testOrder.status})`)
    }
    
    console.log(`\n🎉 Successfully seeded ${testOrders.length} test orders!`)
    console.log('📱 Visit http://localhost:3002/orders to see your orders')
    
    // Show summary
    const statusCounts = testOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const retailerCounts = testOrders.reduce((acc, order) => {
      acc[order.retailer] = (acc[order.retailer] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('\n📊 Summary:')
    console.log('Status distribution:', statusCounts)
    console.log('Retailer distribution:', retailerCounts)
    console.log(`Total value: €${testOrders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)}`)
    
  } catch (error) {
    console.error('💥 Error seeding test data:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
}

export { seedTestData, testOrders }