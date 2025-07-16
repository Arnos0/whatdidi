import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { GmailService } from '@/lib/email/gmail-service'
import { AIEmailClassifier } from '@/lib/email/ai-parser'
import { aiService } from '@/lib/ai/ai-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get email account and verify ownership
    const emailAccount = await serverEmailAccountQueries.getById(params.id, user.id)
    if (!emailAccount) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
    }

    // Check if tokens are available
    if (!emailAccount.access_token || !emailAccount.refresh_token) {
      return NextResponse.json({ error: 'Email account not properly connected' }, { status: 400 })
    }

    // Initialize Gmail service
    const gmail = new GmailService(
      emailAccount.access_token,
      emailAccount.refresh_token
    )

    // Search specifically for Coolblue emails from the last week
    console.log('Searching for Coolblue emails...')
    const searchResult = await gmail.listMessages({
      query: 'from:coolblue',
      dateRange: '1_week',
      maxResults: 10
    })

    console.log(`Found ${searchResult.messages?.length || 0} Coolblue emails`)

    if (!searchResult.messages || searchResult.messages.length === 0) {
      return NextResponse.json({
        message: 'No Coolblue emails found in the last week',
        searchQuery: 'from:coolblue',
        dateRange: '1_week'
      })
    }

    // Fetch full email content for each message
    const emails = await gmail.getMessagesBatch(searchResult.messages.map(m => m.id))
    
    const results = []
    
    for (const email of emails) {
      const { subject, from, date, htmlBody, textBody } = GmailService.extractContent(email)
      const body = (htmlBody || textBody || '').substring(0, 1000) // First 1000 chars for debug
      
      // Check AI email classifier
      const classification = AIEmailClassifier.classify(email)
      
      // Try AI analysis if classified
      let aiResult = null
      if (classification.parser) {
        try {
          const emailContent = {
            subject,
            from,
            date,
            body: (htmlBody || textBody || '').substring(0, 5000)
          }
          
          aiResult = await aiService.analyzeEmail(emailContent)
        } catch (error: any) {
          aiResult = { error: error.message }
        }
      }
      
      results.push({
        id: email.id,
        subject,
        from,
        date: date.toISOString(),
        bodyPreview: body.substring(0, 200) + '...',
        classification: {
          retailer: classification.retailer,
          confidence: classification.confidence,
          willAnalyze: !!classification.parser
        },
        aiAnalysis: aiResult
      })
    }

    return NextResponse.json({
      totalFound: results.length,
      emails: results
    })

  } catch (error: any) {
    console.error('Test Coolblue error:', error)
    return NextResponse.json({ 
      error: 'Failed to test Coolblue emails',
      details: error.message 
    }, { status: 500 })
  }
}