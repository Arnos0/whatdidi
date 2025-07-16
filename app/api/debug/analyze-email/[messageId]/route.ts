import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { createServerClient } from '@/lib/supabase/server-client'
import { GmailService } from '@/lib/email/gmail-service'
import { aiService } from '@/lib/ai/ai-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
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

    // Get first email account for this user
    const supabase = createServerClient()
    const { data: emailAccounts } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    
    if (!emailAccounts) {
      return NextResponse.json({ error: 'No email account found' }, { status: 404 })
    }
    
    // Initialize Gmail service
    const gmail = new GmailService(
      emailAccounts.access_token,
      emailAccounts.refresh_token
    )
    
    // Fetch the specific email
    const email = await gmail.getMessage(params.messageId)
    const { subject, from, date, htmlBody, textBody } = GmailService.extractContent(email)
    
    // Clean and truncate body for analysis
    let body = htmlBody || textBody || ''
    
    // Save original for inspection
    const fs = await import('fs')
    fs.writeFileSync('coolblue-email-raw.html', body)
    
    // Clean for AI
    if (htmlBody) {
      body = body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      body = body.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      body = body.replace(/<[^>]+>/g, ' ')
      body = body
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
    
    // Try multiple body lengths
    const bodyLengths = [2000, 5000, 10000]
    const results = []
    
    for (const length of bodyLengths) {
      const truncatedBody = body.substring(0, length)
      
      // Analyze with AI
      const aiResult = await aiService.analyzeEmail({
        subject,
        from,
        date,
        body: truncatedBody
      })
      
      results.push({
        bodyLength: length,
        actualLength: truncatedBody.length,
        aiResult
      })
    }
    
    // Also show a preview of the cleaned body
    const bodyPreview = body.substring(0, 1000).split(' ')
      .filter(word => word.length > 0)
      .join(' ')
    
    return NextResponse.json({
      email: {
        id: params.messageId,
        subject,
        from,
        date: date.toISOString(),
        originalBodyLength: (htmlBody || textBody || '').length,
        cleanedBodyLength: body.length,
        bodyPreview: bodyPreview + '...',
        savedToFile: 'coolblue-email-raw.html'
      },
      analysisResults: results,
      debug: {
        hasHtml: !!htmlBody,
        hasText: !!textBody,
        // Look for key terms in the cleaned body
        containsOrderNumber: body.toLowerCase().includes('bestelnummer'),
        containsAmount: /€\s*\d+/.test(body),
        containsDelivery: body.toLowerCase().includes('bezorg')
      }
    })
    
  } catch (error: any) {
    console.error('Debug analysis error:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze email',
      details: error.message 
    }, { status: 500 })
  }
}