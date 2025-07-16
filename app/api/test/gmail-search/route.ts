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

    // Test different search queries
    const gmail = new GmailService(gmailAccount.access_token, gmailAccount.refresh_token || '')
    
    // Try broader searches
    const searches = [
      { name: 'Order keywords', query: '(order OR bestelling OR purchase OR aankoop)' },
      { name: 'Receipt keywords', query: '(receipt OR factuur OR invoice OR bon)' },
      { name: 'From noreply', query: 'from:noreply' },
      { name: 'Has attachments', query: 'has:attachment' },
      { name: 'Bol.com', query: 'from:bol.com' },
      { name: 'Coolblue', query: 'from:coolblue' },
      { name: 'Amazon', query: 'from:amazon' },
      { name: 'All emails', query: '' }
    ]
    
    const results: any[] = []
    
    for (const search of searches) {
      try {
        const result = await gmail.listMessages({
          query: search.query,
          maxResults: 10,
          dateRange: '1_month'
        })
        
        results.push({
          ...search,
          found: result.resultSizeEstimate || 0,
          messages: result.messages?.length || 0
        })
      } catch (error: any) {
        results.push({
          ...search,
          error: error.message
        })
      }
    }
    
    // Also get the actual search query used
    const orderSearchResult = await gmail.searchOrderEmails('1_month')
    
    return NextResponse.json({
      account: gmailAccount.email,
      searchTests: results,
      orderSearchQuery: {
        estimatedTotal: orderSearchResult.resultSizeEstimate,
        returned: orderSearchResult.messages?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Gmail search test error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}