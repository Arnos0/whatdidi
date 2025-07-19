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

async function updateTestAccountEmail() {
  try {
    console.log('Updating test account email...')

    // Update to use a Gmail address or test pattern
    const newEmail = 'preview.whatdidi+clerk_test@gmail.com' // Test mode email
    
    const { data, error } = await supabase
      .from('users')
      .update({ email: newEmail })
      .eq('email', 'preview@whatdidi.shop')
      .select()

    if (error) throw error

    console.log('\n✅ Email updated successfully!')
    console.log('\n📧 New test credentials:')
    console.log(`Email: ${newEmail}`)
    console.log('Password: Preview2025Demo!')
    console.log('\n⚠️  For testing: Use verification code 424242')
    console.log('This is a Clerk test email - no actual email will be sent')

  } catch (error) {
    console.error('Error updating email:', error)
  }
}

// Run the script
updateTestAccountEmail()