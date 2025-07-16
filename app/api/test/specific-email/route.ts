import { NextRequest, NextResponse } from 'next/server'
import { AIEmailParser } from '@/lib/email/ai-parser'
import { GmailService } from '@/lib/email/gmail-service'

export async function POST(request: NextRequest) {
  try {
    const { emailData } = await request.json()
    
    if (!emailData) {
      return NextResponse.json({ error: 'No email data provided' }, { status: 400 })
    }
    
    // Create parser instance
    const parser = new AIEmailParser()
    
    // Check if it passes pre-filter
    const passesFilter = parser.canParse(emailData)
    
    let parseResult = null
    if (passesFilter) {
      // Parse with AI
      parseResult = await parser.parse(emailData)
    }
    
    // Extract content for debugging
    const content = GmailService.extractContent(emailData)
    
    return NextResponse.json({
      emailInfo: {
        subject: content.subject,
        from: content.from,
        date: content.date,
        bodyLength: content.textBody.length + content.htmlBody.length
      },
      passesFilter,
      parseResult
    })
    
  } catch (error: any) {
    console.error('Specific email test error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error.message
    }, { status: 500 })
  }
}