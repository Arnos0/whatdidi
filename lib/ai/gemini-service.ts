import 'server-only'
import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any
  
  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set')
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1 // Low temperature for consistent extraction
      }
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
${emailText.substring(0, 5000)}`  // Gemini can handle more content

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()
      
      // Parse the JSON response (Gemini returns clean JSON with responseMimeType)
      const parsedResult = JSON.parse(text)
      
      // Debug: Log the full Gemini response for orders
      if (parsedResult.isOrder) {
        console.log('Full Gemini response for order:', JSON.stringify(parsedResult, null, 2))
      }
      
      // Ensure we always have proper structure
      if (!parsedResult.hasOwnProperty('isOrder')) {
        parsedResult.isOrder = false
      }
      
      // Fix Gemini returning amount as string instead of number
      if (parsedResult.isOrder && parsedResult.orderData) {
        if (typeof parsedResult.orderData.amount === 'string') {
          parsedResult.orderData.amount = parseFloat(parsedResult.orderData.amount)
        }
        
        // Also fix item prices if they're strings
        if (parsedResult.orderData.items && Array.isArray(parsedResult.orderData.items)) {
          parsedResult.orderData.items = parsedResult.orderData.items.map((item: any) => ({
            ...item,
            price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
          }))
        }
        
        // If it's an order but missing confidence, set a default
        if (!parsedResult.orderData.confidence) {
          parsedResult.orderData.confidence = 0.5
        }
      }
      
      // Log for debugging
      console.log('Gemini analysis result:', {
        from: emailContent.from,
        subject: emailContent.subject,
        isOrder: parsedResult.isOrder,
        retailer: parsedResult.orderData?.retailer,
        confidence: parsedResult.orderData?.confidence
      })
      
      return parsedResult
      
    } catch (error) {
      console.error('Error analyzing email with Gemini:', error)
      
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
   * Gemini can handle much larger batches than Claude
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
    
    // Gemini can handle much larger batches - no token rate limits!
    const batchSize = 20 // Increased from 3
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const startTime = Date.now()
      
      // Process batch in parallel - Gemini can handle it
      const batchPromises = batch.map(async (email) => {
        try {
          const result = await this.analyzeEmail({
            subject: email.subject,
            from: email.from,
            date: email.date,
            body: email.body.substring(0, 10000) // Gemini can handle more content
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
      } catch (error: any) {
        console.error(`Error in AI batch ${i}:`, error)
      }
      
      // Log progress
      const elapsed = Date.now() - startTime
      console.log(`Gemini analyzed ${results.size}/${emails.length} emails (batch took ${elapsed}ms)`)
    }
    
    return results
  }
  
  /**
   * Pre-filter emails to reduce API calls
   * Only send potentially relevant emails to Gemini
   */
  static shouldAnalyzeEmail(email: {
    subject: string
    from: string
    body: string
  }): boolean {
    // Same pre-filtering logic as Claude
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
      // Log when Coolblue emails are rejected
      if (fromLower.includes('coolblue') || subjectLower.includes('coolblue')) {
        console.log(`WARNING: Coolblue email rejected by filter: "${email.subject}" from ${email.from}`)
      }
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
let _geminiService: GeminiService | null = null

export const geminiService = {
  analyzeEmail: async (...args: Parameters<GeminiService['analyzeEmail']>) => {
    if (!_geminiService) {
      _geminiService = new GeminiService()
    }
    return _geminiService.analyzeEmail(...args)
  },
  
  batchAnalyzeEmails: async (...args: Parameters<GeminiService['batchAnalyzeEmails']>) => {
    if (!_geminiService) {
      _geminiService = new GeminiService()
    }
    return _geminiService.batchAnalyzeEmails(...args)
  }
}