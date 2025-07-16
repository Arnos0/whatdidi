import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

export class ClaudeService {
  private client: Anthropic
  
  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    
    this.client = new Anthropic({
      apiKey
    })
  }
  
  /**
   * Analyze an email and extract order information
   * Returns structured order data or null if not an order
   */
  async analyzeEmail(emailContent: {
    subject: string
    from: string
    date: Date
    body: string
  }): Promise<{
    isOrder: boolean
    orderData?: {
      orderNumber: string | null
      retailer: string
      amount: number
      currency: string
      orderDate: string
      status: 'confirmed' | 'shipped' | 'delivered'
      estimatedDelivery?: string | null
      trackingNumber?: string | null
      carrier?: string | null
      items?: Array<{
        name: string
        quantity: number
        price: number
      }>
      confidence: number
    }
    debugInfo?: {
      language: string
      emailType: string
    }
  }> {
    try {
      // Prepare the email content for analysis
      const emailText = `
From: ${emailContent.from}
Subject: ${emailContent.subject}
Date: ${emailContent.date.toISOString()}

${emailContent.body}
`
      
      // Create a concise prompt to reduce token usage
      const prompt = `Analyze this email. If it's an order (purchase confirmation/shipping/delivery), extract:
- orderNumber
- retailer  
- amount & currency
- orderDate (ISO)
- status (confirmed/shipped/delivered)
- estimatedDelivery (ISO or null)
- trackingNumber & carrier (if present)
- items array (if detailed)
- confidence (0-1)

Return JSON:
{"isOrder": true/false, "orderData": {...}, "debugInfo": {"language": "xx", "emailType": "..."}}

Email:
${emailText.substring(0, 3000)}`

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1 // Low temperature for consistent extraction
      })
      
      // Parse the response
      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }
      
      // Extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response')
      }
      
      const result = JSON.parse(jsonMatch[0])
      
      // Ensure we always have proper structure
      if (!result.hasOwnProperty('isOrder')) {
        result.isOrder = false
      }
      
      // If it's an order but missing confidence, set a default
      if (result.isOrder && result.orderData && !result.orderData.confidence) {
        result.orderData.confidence = 0.5
      }
      
      // Log for debugging
      console.log('Claude analysis result:', {
        from: emailContent.from,
        subject: emailContent.subject,
        isOrder: result.isOrder,
        retailer: result.orderData?.retailer,
        confidence: result.orderData?.confidence
      })
      
      return result
      
    } catch (error) {
      console.error('Error analyzing email with Claude:', error)
      
      // Return a safe default
      return {
        isOrder: false,
        debugInfo: {
          language: 'unknown',
          emailType: 'error'
        }
      }
    }
  }
  
  /**
   * Batch analyze multiple emails for efficiency
   * This reduces API calls and costs
   */
  async batchAnalyzeEmails(emails: Array<{
    id: string
    subject: string
    from: string
    date: Date
    body: string
  }>): Promise<Map<string, {
    isOrder: boolean
    orderData?: any
    debugInfo?: any
  }>> {
    const results = new Map()
    
    // Reduce batch size to avoid token rate limits
    // 40k tokens/min ÷ 2k tokens/email = ~20 emails/min = ~3 emails per batch with delays
    const batchSize = 3 // Reduced to stay under token limits
    let rateLimitDelay = 3000 // Start with 3 second delay between batches
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const startTime = Date.now()
      
      // Process smaller batch to avoid rate limits
      const batchPromises = batch.map(async (email) => {
        try {
          const result = await this.analyzeEmail({
            subject: email.subject,
            from: email.from,
            date: email.date,
            body: email.body.substring(0, 5000) // Limit body size to reduce tokens
          })
          return { id: email.id, result }
        } catch (error: any) {
          console.error(`Failed to analyze email ${email.id}:`, error.message)
          return { 
            id: email.id, 
            result: { isOrder: false, debugInfo: { error: error.message } }
          }
        }
      })
      
      try {
        const batchResults = await Promise.all(batchPromises)
        
        // Store results
        for (const { id, result } of batchResults) {
          results.set(id, result)
        }
        
        // Gradually reduce delay on success
        rateLimitDelay = Math.max(2000, rateLimitDelay * 0.9)
      } catch (error: any) {
        console.error(`Error in AI batch ${i}:`, error)
        
        // If rate limited, significantly increase delay
        if (error.message?.includes('rate_limit') || error.message?.includes('40,000')) {
          rateLimitDelay = Math.min(10000, rateLimitDelay * 2)
          console.log(`AI rate limited (token limit), increasing delay to ${rateLimitDelay}ms`)
          // Wait extra time for rate limit to reset
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
      
      // Always add delay between batches to respect token rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay))
      }
      
      // Log progress
      const elapsed = Date.now() - startTime
      console.log(`AI analyzed ${results.size}/${emails.length} emails (batch took ${elapsed}ms)`)
    }
    
    return results
  }
  
  /**
   * Pre-filter emails to reduce API calls
   * Only send potentially relevant emails to Claude
   */
  static shouldAnalyzeEmail(email: {
    subject: string
    from: string
    body: string
  }): boolean {
    // For debugging: temporarily make filter more permissive
    const subjectLower = email.subject.toLowerCase()
    const fromLower = email.from.toLowerCase()
    const bodyLower = email.body.toLowerCase()
    
    // Quick reject obvious non-orders
    const rejectPatterns = [
      'unsubscribe', 'newsletter', 'marketing', 'uitschrijven', 'nieuwsbrief',
      'linkedin', 'twitter', 'facebook', 'instagram',
      'password reset', 'wachtwoord reset', 'verify your email',
      'job alert', 'vacature', 'sollicitatie'
    ]
    
    if (rejectPatterns.some(pattern => subjectLower.includes(pattern))) {
      return false
    }
    
    // Check for retail/order patterns in subject or from
    const retailPatterns = [
      // Retailers
      'bol.com', 'coolblue', 'zalando', 'amazon', 'aliexpress', 'wehkamp',
      'mediamarkt', 'albert heijn', 'jumbo', 'picnic', 'gorillas',
      'ajax', 'adidas', 'nike', 'decathlon', 'hema', 'action',
      
      // Order keywords in subject
      'bestelling', 'order', 'aankoop', 'purchase', 'verzending', 'shipping',
      'bezorging', 'delivery', 'track', 'pakket', 'package',
      'bevestiging', 'confirmation', 'ontvangst', 'receipt',
      'betaling', 'payment', 'factuur', 'invoice',
      
      // Common order subject patterns
      'bestelnummer', 'order number', 'ordernummer',
      'komt eraan', 'on its way', 'onderweg',
      'verzonden', 'shipped', 'verstuurd',
      'afgeleverd', 'delivered', 'bezorgd'
    ]
    
    // If subject or from contains retail patterns, analyze it
    const hasRetailPattern = retailPatterns.some(pattern => 
      subjectLower.includes(pattern) || fromLower.includes(pattern)
    )
    
    if (hasRetailPattern) {
      return true
    }
    
    // If body is empty but subject looks like an order, still analyze
    if (email.body.length === 0 && subjectLower.includes('bestelling')) {
      return true
    }
    
    // Check body for order keywords (only if body exists)
    if (email.body.length > 0) {
      const bodyOrderKeywords = [
        'order', 'bestelling', 'invoice', 'factuur', 'receipt', 'bevestiging',
        'tracking', 'bezorging', 'shipping', 'verzending'
      ]
      
      return bodyOrderKeywords.some(keyword => bodyLower.includes(keyword))
    }
    
    return false
  }
}

// Lazy initialization to prevent build-time failures
let _claudeService: ClaudeService | null = null

export const claudeService = {
  analyzeEmail: async (...args: Parameters<ClaudeService['analyzeEmail']>) => {
    if (!_claudeService) {
      _claudeService = new ClaudeService()
    }
    return _claudeService.analyzeEmail(...args)
  },
  
  batchAnalyzeEmails: async (...args: Parameters<ClaudeService['batchAnalyzeEmails']>) => {
    if (!_claudeService) {
      _claudeService = new ClaudeService()
    }
    return _claudeService.batchAnalyzeEmails(...args)
  }
}