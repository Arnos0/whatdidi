import type { GmailMessage, ParsedOrder, EmailParser } from '@/lib/types/email'
import { GmailService } from '@/lib/email/gmail-service'
import { aiService, shouldAnalyzeEmail } from '@/lib/ai/ai-service'
import { detectEmailLanguage } from './utils/language-detector'
import { LANGUAGE_PATTERNS, UNIVERSAL_REJECT_PATTERNS } from './utils/multilingual-patterns'
import { ParserRegistry } from './parsers/parser-registry'

/**
 * Universal AI-powered email parser
 * Uses AI (Gemini/Claude) to intelligently extract order information from any email
 * Handles all languages and retailers without custom code
 */
export class AIEmailParser implements EmailParser {
  constructor() {
    // No need to store claudeService, we'll use it directly
  }
  
  /**
   * AI parser can potentially parse any email
   * We use pre-filtering to optimize API usage
   */
  canParse(email: GmailMessage): boolean {
    const { subject, from, htmlBody, textBody } = GmailService.extractContent(email)
    const body = htmlBody || textBody || ''
    
    // Always analyze Coolblue emails for debugging
    if (from.toLowerCase().includes('coolblue') || subject.toLowerCase().includes('coolblue')) {
      console.log(`COOLBLUE EMAIL DETECTED: "${subject}" from ${from}`)
      console.log(`  - Body length: ${body.length}`)
      console.log(`  - Will force AI analysis for Coolblue`)
      return true
    }
    
    // Debug logging to see what we're checking
    console.log(`Pre-filter check: "${subject}" from ${from} (body length: ${body.length})`)
    
    // Use AI's pre-filter to check if this email is worth analyzing
    const shouldAnalyze = shouldAnalyzeEmail({
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
      
      // Analyze with AI service
      const result = await aiService.analyzeEmail({
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

export interface ClassificationResult {
  isPotentialOrder: boolean
  confidence: number
  language: string
  retailer: string | null
  parser: EmailParser | null
  debugInfo?: {
    detectedLanguage: string
    patterns: string[]
    rejectPatterns: string[]
  }
}

/**
 * Multilingual AI-based email classifier
 */
export class AIEmailClassifier {
  /**
   * Classify an email with language detection and multilingual patterns
   */
  static classify(email: GmailMessage): ClassificationResult {
    const { subject, from, htmlBody, textBody } = GmailService.extractContent(email)
    const body = textBody || htmlBody || ''
    const emailText = `${subject} ${body}`.substring(0, 2000)
    
    // First, check if any specific parser can handle this email
    const parser = ParserRegistry.findParser(email)
    if (parser) {
      console.log(`Parser found for email: ${parser.getRetailerName()}`)
      return {
        isPotentialOrder: true,
        confidence: 0.9,
        language: 'en', // Parser will handle language detection
        retailer: parser.getRetailerName(),
        parser: parser,
        debugInfo: {
          detectedLanguage: 'en',
          patterns: [`${parser.getRetailerName()} parser match`],
          rejectPatterns: []
        }
      }
    }
    
    // Extract sender domain for language override
    const senderDomain = from.match(/@([^>]+)/)?.[1]
    
    // Detect language
    const language = detectEmailLanguage(emailText, senderDomain)
    const patterns = LANGUAGE_PATTERNS[language] || LANGUAGE_PATTERNS['en']
    
    // Build combined reject patterns
    const allRejectPatterns = [
      ...patterns.reject,
      ...UNIVERSAL_REJECT_PATTERNS
    ]
    
    // Check reject patterns
    const lowerEmailText = emailText.toLowerCase()
    const foundRejectPatterns = allRejectPatterns.filter(pattern => 
      lowerEmailText.includes(pattern.toLowerCase())
    )
    
    if (foundRejectPatterns.length > 0) {
      return {
        isPotentialOrder: false,
        confidence: 1.0,
        language,
        retailer: null,
        parser: null,
        debugInfo: {
          detectedLanguage: language,
          patterns: [],
          rejectPatterns: foundRejectPatterns
        }
      }
    }
    
    // Check retail patterns
    const foundRetailPatterns = patterns.retail.filter(pattern =>
      lowerEmailText.includes(pattern.toLowerCase())
    )
    
    // Calculate confidence based on pattern matches
    const confidence = Math.min(1.0, foundRetailPatterns.length * 0.25)
    const isPotentialOrder = foundRetailPatterns.length > 0
    
    return {
      isPotentialOrder,
      confidence,
      language,
      retailer: isPotentialOrder ? 'Pending AI Analysis' : null,
      parser: isPotentialOrder ? aiEmailParser : null,
      debugInfo: {
        detectedLanguage: language,
        patterns: foundRetailPatterns,
        rejectPatterns: []
      }
    }
  }
}