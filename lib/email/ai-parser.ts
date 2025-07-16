import type { GmailMessage, ParsedOrder, EmailParser } from '@/lib/types/email'
import { GmailService } from '@/lib/email/gmail-service'
import { ClaudeService, claudeService } from '@/lib/ai/claude-service'

/**
 * Universal AI-powered email parser
 * Uses Claude to intelligently extract order information from any email
 * Handles all languages and retailers without custom code
 */
export class AIEmailParser implements EmailParser {
  private claudeService: ClaudeService
  
  constructor() {
    this.claudeService = claudeService
  }
  
  /**
   * AI parser can potentially parse any email
   * We use pre-filtering to optimize API usage
   */
  canParse(email: GmailMessage): boolean {
    const { subject, from, htmlBody, textBody } = GmailService.extractContent(email)
    const body = htmlBody || textBody || ''
    
    // Debug logging to see what we're checking
    console.log(`Pre-filter check: "${subject}" from ${from} (body length: ${body.length})`)
    
    // Use Claude's pre-filter to check if this email is worth analyzing
    const shouldAnalyze = ClaudeService.shouldAnalyzeEmail({
      subject,
      from,
      body
    })
    
    if (!shouldAnalyze) {
      console.log(`Pre-filter rejected: "${subject}"`)
    }
    
    return shouldAnalyze
  }
  
  /**
   * Parse email using AI to extract order information
   */
  async parse(email: GmailMessage): Promise<ParsedOrder | null> {
    try {
      const { subject, from, date, htmlBody, textBody } = GmailService.extractContent(email)
      const body = this.cleanEmailBody(htmlBody || textBody || '')
      
      // If body is too short, skip
      if (body.length < 50) {
        console.log('Email body too short, skipping AI analysis')
        return null
      }
      
      // Analyze with Claude
      const result = await this.claudeService.analyzeEmail({
        subject,
        from,
        date,
        body
      })
      
      // If not an order, return null
      if (!result.isOrder || !result.orderData) {
        console.log(`AI determined email is not an order: ${result.debugInfo?.emailType}`)
        return null
      }
      
      // Convert AI response to ParsedOrder format
      const orderData = result.orderData
      const parsedOrder: ParsedOrder = {
        order_number: orderData.orderNumber || this.generateOrderNumber(from, date),
        retailer: orderData.retailer,
        amount: orderData.amount,
        currency: orderData.currency,
        order_date: orderData.orderDate,
        status: orderData.status,
        estimated_delivery: orderData.estimatedDelivery,
        tracking_number: orderData.trackingNumber,
        carrier: orderData.carrier,
        items: orderData.items,
        confidence: orderData.confidence
      }
      
      console.log(`AI successfully parsed order from ${parsedOrder.retailer}:`, {
        orderNumber: parsedOrder.order_number,
        amount: `${parsedOrder.currency} ${parsedOrder.amount}`,
        confidence: parsedOrder.confidence,
        language: result.debugInfo?.language
      })
      
      return parsedOrder
      
    } catch (error) {
      console.error('Error in AI email parsing:', error)
      return null
    }
  }
  
  /**
   * Clean email body for better AI analysis
   */
  private cleanEmailBody(body: string): string {
    // Remove excessive whitespace
    let cleaned = body.replace(/\s+/g, ' ').trim()
    
    // If HTML, try to extract text content
    if (cleaned.includes('<html') || cleaned.includes('<body')) {
      // Remove script and style tags
      cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      
      // Remove HTML tags but keep content
      cleaned = cleaned.replace(/<[^>]+>/g, ' ')
      
      // Decode HTML entities
      cleaned = cleaned
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
    }
    
    // Remove URLs to reduce noise (optional, keeping important ones)
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '[URL]')
    
    // Limit length to avoid token limits
    if (cleaned.length > 10000) {
      cleaned = cleaned.substring(0, 10000) + '... [truncated]'
    }
    
    return cleaned
  }
  
  /**
   * Generate a fallback order number if AI couldn't extract one
   * This ensures we can still track the order
   */
  private generateOrderNumber(from: string, date: Date): string {
    const retailer = from.split('@')[1]?.split('.')[0] || 'unknown'
    const timestamp = date.getTime().toString(36)
    return `AI-${retailer}-${timestamp}`.toUpperCase()
  }
  
  getRetailerName(): string {
    return 'AI Universal Parser'
  }
  
  getRetailerDomains(): string[] {
    // AI parser works with all domains
    return ['*']
  }
}

/**
 * Singleton instance of the AI parser
 */
export const aiEmailParser = new AIEmailParser()

/**
 * Replace the parser registry with a simple AI-based classifier
 */
export class AIEmailClassifier {
  /**
   * Classify an email and get the AI parser if it's an order
   */
  static classify(email: GmailMessage): {
    retailer: string | null
    confidence: number
    parser: EmailParser | null
  } {
    // Check if AI parser can handle this email
    if (aiEmailParser.canParse(email)) {
      return {
        retailer: 'Pending AI Analysis',
        confidence: 0.8, // High confidence in AI's ability
        parser: aiEmailParser
      }
    }
    
    return {
      retailer: null,
      confidence: 0,
      parser: null
    }
  }
}