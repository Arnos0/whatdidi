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

async function findArnoUser() {
  try {
    console.log('Searching for arno@wedevelop.nl user...\n')

    // Find all users with this email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email, created_at')
      .eq('email', 'arno@wedevelop.nl')

    if (userError) {
      console.error('Error searching users:', userError)
      return
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found with email arno@wedevelop.nl')
      
      // Check if there are any users with similar emails
      const { data: similarUsers } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', '%arno%')
      
      if (similarUsers && similarUsers.length > 0) {
        console.log('\n🔍 Found users with similar emails:')
        similarUsers.forEach(user => {
          console.log(`- ${user.email} (ID: ${user.id})`)
        })
      }
      return
    }

    console.log(`Found ${users.length} user(s) with email arno@wedevelop.nl:`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Clerk ID: ${user.clerk_id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.created_at}`)
      console.log('')
    })

    // Check orders for each user
    for (const user of users) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, retailer, amount, status')
        .eq('user_id', user.id)

      console.log(`Orders for user ${user.id}: ${orders?.length || 0}`)
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          console.log(`  - ${order.order_number} (${order.retailer}) - €${order.amount}`)
        })
      }
      console.log('')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
findArnoUser()