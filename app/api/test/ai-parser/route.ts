import { NextRequest, NextResponse } from 'next/server'
import { AIEmailParser } from '@/lib/email/ai-parser'
import { ClaudeService } from '@/lib/ai/claude-service'

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'ANTHROPIC_API_KEY not configured',
        setup: 'Please add ANTHROPIC_API_KEY to your .env.local file'
      }, { status: 500 })
    }
    
    // Test sample emails
    const sampleEmails = [
      {
        id: 'test-1',
        subject: 'Bevestiging van je bestelling #12345678',
        from: 'Bol.com <noreply@bol.com>',
        date: new Date(),
        body: `
          Beste klant,
          
          Bedankt voor je bestelling bij bol.com!
          
          Bestelnummer: 12345678
          Totaalbedrag: €123,45
          
          Je bestelling wordt morgen bezorgd tussen 09:00 en 17:00.
          
          Artikelen:
          - Sony WH-1000XM4 Koptelefoon (1x) - €299,00
          - USB-C Kabel 2m (2x) - €19,99
          
          Track je pakket: https://tracking.bol.com/12345678
          
          Met vriendelijke groet,
          Bol.com
        `
      },
      {
        id: 'test-2', 
        subject: 'Order Confirmation - Your Zalando Order #ZAL-987654',
        from: 'Zalando <no-reply@zalando.nl>',
        date: new Date(),
        body: `
          Thank you for your order!
          
          Order number: ZAL-987654
          Order date: ${new Date().toLocaleDateString()}
          Total amount: €89.95
          
          Items ordered:
          1x Nike Air Max - Size 42 - €89.95
          
          Estimated delivery: 3-5 business days
          
          Track your order at zalando.nl/track
        `
      },
      {
        id: 'test-3',
        subject: 'Newsletter: Special offers this week!',
        from: 'Marketing <marketing@shop.com>',
        date: new Date(),
        body: `
          Check out our amazing deals this week!
          
          Save up to 50% on selected items.
          
          Unsubscribe | Privacy Policy
        `
      }
    ]
    
    const results = []
    
    // Create parser instance
    const parser = new AIEmailParser()
    
    for (const email of sampleEmails) {
      // Check if email should be analyzed
      const shouldAnalyze = ClaudeService.shouldAnalyzeEmail(email)
      
      if (shouldAnalyze) {
        // Create a mock Gmail message
        const mockGmailMessage = {
          id: email.id,
          threadId: email.id,
          labelIds: [],
          snippet: email.body.substring(0, 100),
          payload: {
            headers: [
              { name: 'Subject', value: email.subject },
              { name: 'From', value: email.from },
              { name: 'Date', value: email.date.toISOString() }
            ],
            body: {
              data: Buffer.from(email.body).toString('base64')
            }
          },
          internalDate: email.date.getTime().toString()
        }
        
        // Parse with AI
        const parsed = await parser.parse(mockGmailMessage as any)
        
        results.push({
          email: {
            id: email.id,
            subject: email.subject,
            from: email.from
          },
          shouldAnalyze,
          parsed: parsed || { error: 'No order detected' }
        })
      } else {
        results.push({
          email: {
            id: email.id,
            subject: email.subject,
            from: email.from
          },
          shouldAnalyze,
          parsed: { skipped: 'Pre-filter determined not an order email' }
        })
      }
    }
    
    return NextResponse.json({
      status: 'AI Parser Test Complete',
      anthropicKeyConfigured: true,
      results,
      costEstimate: `$${(results.filter(r => r.shouldAnalyze).length * 0.003).toFixed(3)}`
    })
    
  } catch (error: any) {
    console.error('AI parser test error:', error)
    return NextResponse.json({
      error: 'AI parser test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}