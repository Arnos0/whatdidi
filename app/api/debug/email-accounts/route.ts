import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries } from '@/lib/supabase/server-queries'
import { createServerClient } from '@/lib/supabase/server-client'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all email accounts for this user
    const supabase = createServerClient()
    const { data: emailAccounts, error } = await supabase
      .from('email_accounts')
      .select('id, email, provider, created_at, last_scan_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 })
    }

    return NextResponse.json({
      user_id: user.id,
      email_accounts: emailAccounts?.map(account => ({
        id: account.id,
        email: account.email,
        provider: account.provider,
        created_at: account.created_at,
        last_scan_at: account.last_scan_at,
        diagnostics_url: `http://localhost:3002/api/email-accounts/${account.id}/diagnostics`,
        test_coolblue_url: `http://localhost:3002/api/email-accounts/${account.id}/test-coolblue`
      }))
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Failed to get email accounts',
      details: error.message 
    }, { status: 500 })
  }
}