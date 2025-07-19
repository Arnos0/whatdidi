import { createClient } from '@supabase/supabase-js'
import { hash } from 'bcryptjs'
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

async function createTestAccount() {
  try {
    console.log('Creating test account with sample data...')

    // 1. Create test user in Clerk (we'll simulate with a user record)
    const testUser = {
      email: 'preview@whatdidi.shop',
      name: 'Preview Demo User',
      clerk_id: 'user_preview_demo_2025', // Simulated Clerk ID
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser.email)
      .single()

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log('User already exists, using existing user ID:', userId)
      
      // Clean up existing data
      await supabase.from('order_items').delete().eq('order_id', 'IN (SELECT id FROM orders WHERE user_id = $1)', userId)
      await supabase.from('deliveries').delete().eq('order_id', 'IN (SELECT id FROM orders WHERE user_id = $1)', userId)
      await supabase.from('orders').delete().eq('user_id', userId)
      await supabase.from('email_accounts').delete().eq('user_id', userId)
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: testUser.email,
          name: testUser.name,
          clerk_id: testUser.clerk_id,
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preview'
        })
        .select()
        .single()

      if (userError) throw userError
      userId = newUser.id
      console.log('Created new user:', userId)
    }

    // 2. Create sample orders with diverse retailers and statuses
    const orders = [
      // Recent delivered orders
      {
        order_number: 'BOL-2025-001234',
        retailer: 'Bol.com',
        amount: 89.99,
        currency: 'EUR',
        status: 'delivered',
        order_date: new Date('2025-01-10'),
        estimated_delivery: new Date('2025-01-12'),
        actual_delivery: new Date('2025-01-11'),
        tracking_number: 'NL-POST-123456789',
        carrier: 'PostNL',
        items: [
          { description: 'Sony WH-1000XM5 Noise Cancelling Headphones', quantity: 1, price: 89.99, product_category: 'Electronics' }
        ]
      },
      {
        order_number: 'CB-2024-987654',
        retailer: 'Coolblue',
        amount: 459.00,
        currency: 'EUR',
        status: 'delivered',
        order_date: new Date('2024-12-20'),
        estimated_delivery: new Date('2024-12-22'),
        actual_delivery: new Date('2024-12-21'),
        tracking_number: 'DHL-NL-987654321',
        carrier: 'DHL',
        items: [
          { description: 'iPad Air (2024) 64GB WiFi Space Gray', quantity: 1, price: 399.00, product_category: 'Electronics' },
          { description: 'Apple Pencil (2nd Generation)', quantity: 1, price: 60.00, product_category: 'Accessories' }
        ]
      },
      
      // Currently shipping
      {
        order_number: 'AMZ-NL-2025-5678',
        retailer: 'Amazon.nl',
        amount: 234.50,
        currency: 'EUR',
        status: 'shipped',
        order_date: new Date('2025-01-17'),
        estimated_delivery: new Date('2025-01-20'),
        tracking_number: 'AMZL-NL-2025-5678',
        carrier: 'Amazon Logistics',
        items: [
          { description: 'Nike Air Max 270 - Size 42 EU', quantity: 1, price: 119.99, product_category: 'Fashion' },
          { description: 'Adidas Running Socks (3-pack)', quantity: 2, price: 24.99, product_category: 'Fashion' },
          { description: 'Fitness Resistance Bands Set', quantity: 1, price: 34.99, product_category: 'Sports' },
          { description: 'Protein Powder - Vanilla 1kg', quantity: 1, price: 29.54, product_category: 'Health' }
        ]
      },
      
      // Processing orders
      {
        order_number: 'ZAL-2025-ABCD',
        retailer: 'Zalando',
        amount: 175.95,
        currency: 'EUR',
        status: 'processing',
        order_date: new Date('2025-01-18'),
        estimated_delivery: new Date('2025-01-23'),
        items: [
          { description: 'Levi\'s 501 Original Jeans - Dark Blue', quantity: 1, price: 89.95, product_category: 'Fashion' },
          { description: 'Tommy Hilfiger T-Shirt - White', quantity: 2, price: 35.00, product_category: 'Fashion' },
          { description: 'Calvin Klein Boxers (3-pack)', quantity: 1, price: 51.00, product_category: 'Fashion' }
        ]
      },
      
      // Pending order (just placed)
      {
        order_number: 'AH-ONLINE-2025-9999',
        retailer: 'Albert Heijn',
        amount: 87.43,
        currency: 'EUR',
        status: 'pending',
        order_date: new Date('2025-01-19'),
        estimated_delivery: new Date('2025-01-19'), // Same day delivery
        items: [
          { description: 'Weekly Grocery Shopping', quantity: 1, price: 87.43, product_category: 'Groceries' }
        ]
      },
      
      // Older orders for history
      {
        order_number: 'BOL-2024-567890',
        retailer: 'Bol.com',
        amount: 699.00,
        currency: 'EUR',
        status: 'delivered',
        order_date: new Date('2024-11-15'),
        estimated_delivery: new Date('2024-11-17'),
        actual_delivery: new Date('2024-11-16'),
        tracking_number: 'NL-POST-567890123',
        carrier: 'PostNL',
        items: [
          { description: 'PlayStation 5 Console', quantity: 1, price: 499.00, product_category: 'Gaming' },
          { description: 'DualSense Wireless Controller', quantity: 1, price: 69.00, product_category: 'Gaming' },
          { description: 'Spider-Man 2 PS5 Game', quantity: 1, price: 69.00, product_category: 'Gaming' },
          { description: 'HDMI 2.1 Cable 2m', quantity: 1, price: 25.00, product_category: 'Electronics' },
          { description: 'Controller Charging Station', quantity: 1, price: 37.00, product_category: 'Gaming' }
        ]
      },
      {
        order_number: 'MCC-2024-112233',
        retailer: 'MediaMarkt',
        amount: 1249.00,
        currency: 'EUR',
        status: 'delivered',
        order_date: new Date('2024-10-20'),
        estimated_delivery: new Date('2024-10-22'),
        actual_delivery: new Date('2024-10-22'),
        tracking_number: 'DHL-NL-112233445',
        carrier: 'DHL',
        items: [
          { description: 'LG OLED TV 55" C3 Series', quantity: 1, price: 1099.00, product_category: 'Electronics' },
          { description: 'Sonos Beam Gen 2 Soundbar', quantity: 1, price: 150.00, product_category: 'Electronics' }
        ]
      },
      
      // International order
      {
        order_number: 'ASOS-2024-XYZ123',
        retailer: 'ASOS',
        amount: 156.45,
        currency: 'EUR',
        status: 'delivered',
        order_date: new Date('2024-09-10'),
        estimated_delivery: new Date('2024-09-15'),
        actual_delivery: new Date('2024-09-14'),
        tracking_number: 'UPS-INT-789456',
        carrier: 'UPS',
        items: [
          { description: 'Winter Jacket - Black', quantity: 1, price: 89.99, product_category: 'Fashion' },
          { description: 'Wool Scarf - Grey', quantity: 1, price: 29.99, product_category: 'Fashion' },
          { description: 'Leather Gloves', quantity: 1, price: 36.47, product_category: 'Fashion' }
        ]
      },
      
      // Cancelled order
      {
        order_number: 'WEH-2024-CANC01',
        retailer: 'Wehkamp',
        amount: 124.95,
        currency: 'EUR',
        status: 'cancelled',
        order_date: new Date('2024-08-05'),
        items: [
          { description: 'Outdoor Furniture Set', quantity: 1, price: 124.95, product_category: 'Home & Garden' }
        ]
      },
      
      // Various other retailers
      {
        order_number: 'HEMA-2024-445566',
        retailer: 'HEMA',
        amount: 45.80,
        currency: 'EUR',
        status: 'delivered',
        order_date: new Date('2024-12-10'),
        estimated_delivery: new Date('2024-12-12'),
        actual_delivery: new Date('2024-12-11'),
        items: [
          { description: 'Christmas Decorations Set', quantity: 1, price: 25.00, product_category: 'Home' },
          { description: 'Scented Candles (3-pack)', quantity: 1, price: 12.50, product_category: 'Home' },
          { description: 'Gift Wrapping Paper', quantity: 1, price: 8.30, product_category: 'Home' }
        ]
      },
      {
        order_number: 'DECATH-2025-SP001',
        retailer: 'Decathlon',
        amount: 267.45,
        currency: 'EUR',
        status: 'processing',
        order_date: new Date('2025-01-16'),
        estimated_delivery: new Date('2025-01-21'),
        items: [
          { description: 'Mountain Bike Helmet', quantity: 1, price: 79.99, product_category: 'Sports' },
          { description: 'Cycling Jersey - Blue', quantity: 1, price: 49.99, product_category: 'Sports' },
          { description: 'Bike Repair Kit', quantity: 1, price: 34.99, product_category: 'Sports' },
          { description: 'Water Bottles (2-pack)', quantity: 1, price: 15.99, product_category: 'Sports' },
          { description: 'Bike Lock', quantity: 1, price: 45.00, product_category: 'Sports' },
          { description: 'LED Bike Lights Set', quantity: 1, price: 41.49, product_category: 'Sports' }
        ]
      }
    ]

    // Insert orders
    for (const orderData of orders) {
      const { items, actual_delivery, ...orderFields } = orderData
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...orderFields,
          user_id: userId,
          raw_email_data: {
            subject: `Order Confirmation - ${orderData.order_number}`,
            from: `noreply@${orderData.retailer.toLowerCase().replace(/\s+/g, '')}.com`,
            parsed_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        continue
      }

      // Insert order items
      const itemsToInsert = items.map(item => ({
        order_id: order.id,
        ...item,
        product_name: item.description,
        image_url: `https://via.placeholder.com/200x200.png?text=${encodeURIComponent(item.description.split(' ')[0])}`
      }))

      await supabase.from('order_items').insert(itemsToInsert)

      // Create delivery record for shipped/delivered orders
      if (['shipped', 'delivered'].includes(orderData.status) && orderData.tracking_number) {
        await supabase.from('deliveries').insert({
          order_id: order.id,
          carrier: orderData.carrier,
          tracking_number: orderData.tracking_number,
          status: orderData.status === 'delivered' ? 'delivered' : 'in_transit',
          estimated_delivery: orderData.estimated_delivery,
          actual_delivery: actual_delivery || null,
          tracking_events: [
            {
              timestamp: orderData.order_date.toISOString(),
              status: 'Order placed',
              location: 'Online'
            },
            {
              timestamp: new Date(orderData.order_date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'Package picked up',
              location: 'Distribution Center'
            }
          ]
        })
      }
    }

    // 3. Create a sample email account (disabled by default)
    await supabase.from('email_accounts').insert({
      user_id: userId,
      provider: 'gmail',
      email: 'preview.demo@gmail.com',
      scan_enabled: false,
      last_scan_at: new Date('2025-01-19'),
      total_emails_processed: 156,
      total_orders_created: 11,
      scan_config: {
        scan_interval_hours: 24,
        folders_to_scan: ['INBOX'],
        max_emails_per_scan: 100
      }
    })

    console.log('\n✅ Test account created successfully!')
    console.log('\n📧 Login credentials:')
    console.log('Email: preview@whatdidi.shop')
    console.log('Password: Preview2025Demo!')
    console.log('\n📊 Sample data created:')
    console.log(`- ${orders.length} orders from various retailers`)
    console.log('- Multiple order statuses (pending, processing, shipped, delivered, cancelled)')
    console.log('- Orders spanning from August 2024 to January 2025')
    console.log('- Diverse product categories (Electronics, Fashion, Gaming, Sports, etc.)')
    console.log('- 1 connected email account (disabled)')
    
    console.log('\n⚠️  Note: You\'ll need to create the Clerk account separately with these credentials')
    console.log('Visit the sign-up page and use the email/password above.')

  } catch (error) {
    console.error('Error creating test account:', error)
  }
}

// Run the script
createTestAccount()