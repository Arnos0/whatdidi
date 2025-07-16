import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { GmailService } from '@/lib/email/gmail-service'

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get first Gmail account
    const accounts = await serverEmailAccountQueries.getByUserId(user.id)
    const gmailAccount = accounts.find(a => a.provider === 'google' && a.scan_enabled)
    
    if (!gmailAccount) {
      return NextResponse.json({ error: 'No active Gmail account found' }, { status: 404 })
    }

    if (!gmailAccount.access_token) {
      return NextResponse.json({ error: 'Gmail account has no access token' }, { status: 400 })
    }

    const gmail = new GmailService(gmailAccount.access_token, gmailAccount.refresh_token || '')
    
    // Test different queries for 2 weeks
    const queries = [
      { name: 'All emails', query: '' },
      { name: 'Order keywords', query: '(order OR bestelling)' },
      { name: 'Invoice keywords', query: '(invoice OR factuur OR receipt)' },
      { name: 'Shipping keywords', query: '(shipping OR delivery OR package OR track)' },
      { name: 'From filters', query: '(from:noreply OR from:no-reply OR from:donotreply)' },
      { name: 'Subject order', query: 'subject:order' },
      { name: 'Subject bestelling', query: 'subject:bestelling' },
      { name: 'Has attachment', query: 'has:attachment' }
    ]
    
    const results: any[] = []
    
    for (const test of queries) {
      const result = await gmail.listMessages({
        query: test.query,
        dateRange: '2_weeks',
        maxResults: 500
      })
      
      results.push({
        ...test,
        count: result.messages?.length || 0,
        estimated: result.resultSizeEstimate
      })
    }
    
    return NextResponse.json({
      account: gmailAccount.email,
      dateRange: '2_weeks',
      results
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}