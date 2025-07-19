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

async function syncTestAccount() {
  try {
    console.log('Syncing test account data...')

    // First, find the old test user with the data
    const { data: oldUser, error: oldUserError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', 'user_preview_demo_2025')
      .single()

    if (!oldUser) {
      console.error('Old test user not found')
      return
    }

    console.log('Found old test user:', oldUser.id)

    // Find the new user created by Clerk (should have preview@whatdidi.shop email)
    const { data: newUser, error: newUserError } = await supabase
      .from('users')
      .select('id, clerk_id')
      .eq('email', 'preview@whatdidi.shop')
      .neq('clerk_id', 'user_preview_demo_2025')
      .single()

    if (!newUser) {
      console.error('New Clerk user not found. Make sure you logged in at least once.')
      console.log('The user should have been created automatically when you first signed in.')
      return
    }

    console.log('Found new Clerk user:', newUser.id, 'with clerk_id:', newUser.clerk_id)

    // Update all orders to point to the new user
    const { data: updatedOrders, error: orderError } = await supabase
      .from('orders')
      .update({ user_id: newUser.id })
      .eq('user_id', oldUser.id)
      .select()

    if (orderError) {
      console.error('Error updating orders:', orderError)
      return
    }

    console.log(`✅ Successfully updated ${updatedOrders.length} orders`)

    // Update email accounts
    const { error: emailError } = await supabase
      .from('email_accounts')
      .update({ user_id: newUser.id })
      .eq('user_id', oldUser.id)

    if (emailError) {
      console.error('Error updating email accounts:', emailError)
    }

    // Clean up the old test user
    await supabase
      .from('users')
      .delete()
      .eq('id', oldUser.id)

    console.log('\n✅ Test account synced successfully!')
    console.log('You can now log in with preview@whatdidi.shop and see all the test orders.')

  } catch (error) {
    console.error('Error syncing test account:', error)
  }
}

// Run the script
syncTestAccount()