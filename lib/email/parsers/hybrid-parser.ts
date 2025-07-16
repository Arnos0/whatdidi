/**
 * Hybrid parsing system that combines regex-based parsing with AI fallback
 * Implements confidence-based routing for optimal performance and accuracy
 */

import type { GmailMessage, ParsedOrder } from '@/lib/types/email'
import { parseByRetailer, type RetailerParseResult } from './retailer-parsers'
import { GeminiService } from '@/lib/ai/gemini-service'
import { detectEmailLanguage } from '@/lib/email/utils/language-detector'
import { shouldAnalyzeEmail } from '@/lib/ai/ai-service'

export interface HybridParseResult {
  order: ParsedOrder | null
  confidence: number
  method: 'regex' | 'ai' | 'hybrid'
  processingTime: number
  debugInfo: {
    regexResult?: RetailerParseResult
    aiResult?: any
    language: string
    retailer: string
    routingDecision: string
    confidenceThreshold: number
  }
}

export class HybridEmailParser {
  private readonly CONFIDENCE_THRESHOLD = 0.8
  private readonly AI_FALLBACK_THRESHOLD = 0.7
  
  /**
   * Parse email using hybrid approach: regex first, AI fallback if needed
   */
  async parseEmail(email: GmailMessage): Promise<HybridParseResult> {
    const startTime = Date.now()
    
    const debugInfo: {
      language: string
      retailer: string
      routingDecision: string
      confidenceThreshold: number
      regexResult?: RetailerParseResult
      aiResult?: any
    } = {
      language: '',
      retailer: '',
      routingDecision: '',
      confidenceThreshold: this.CONFIDENCE_THRESHOLD
    }
    
    try {
      // Extract email content
      const emailText = this.extractEmailText(email)
      
      // Step 1: Detect language
      const language = detectEmailLanguage(emailText)
      debugInfo.language = language
      
      // Step 2: Classify email to identify retailer
      const classification = this.classifyEmail(email, emailText)
      if (!classification.isOrder) {
        debugInfo.routingDecision = 'rejected:not_order'
        return {
          order: null,
          confidence: 0,
          method: 'regex',
          processingTime: Date.now() - startTime,
          debugInfo
        }
      }
      
      debugInfo.retailer = classification.retailer || 'unknown'
      
      // Step 3: Try regex-based parsing first
      const regexResult = await parseByRetailer(
        emailText,
        classification.retailer || 'unknown',
        language,
        email
      )
      
      debugInfo.regexResult = regexResult
      
      // Step 4: Decision logic based on confidence
      if (regexResult.confidence >= this.CONFIDENCE_THRESHOLD) {
        // High confidence - use regex result
        debugInfo.routingDecision = `regex:high_confidence:${regexResult.confidence}`
        return {
          order: regexResult.order,
          confidence: regexResult.confidence,
          method: 'regex',
          processingTime: Date.now() - startTime,
          debugInfo
        }
      } else if (regexResult.confidence >= this.AI_FALLBACK_THRESHOLD) {
        // Medium confidence - try AI enhancement
        debugInfo.routingDecision = `hybrid:medium_confidence:${regexResult.confidence}`
        
        try {
          const aiResult = await this.enhanceWithAI(
            emailText,
            regexResult.order,
            language,
            classification.retailer || 'unknown'
          )
          
          debugInfo.aiResult = aiResult
          
          // Merge regex and AI results
          const hybridOrder = this.mergeResults(regexResult.order, aiResult)
          const hybridConfidence = Math.max(regexResult.confidence, aiResult.confidence || 0)
          
          return {
            order: hybridOrder,
            confidence: hybridConfidence,
            method: 'hybrid',
            processingTime: Date.now() - startTime,
            debugInfo
          }
        } catch (aiError) {
          console.error('AI enhancement failed, falling back to regex result:', aiError)
          debugInfo.routingDecision = `regex:ai_fallback_failed:${regexResult.confidence}`
          return {
            order: regexResult.order,
            confidence: regexResult.confidence,
            method: 'regex',
            processingTime: Date.now() - startTime,
            debugInfo
          }
        }
      } else {
        // Low confidence - use AI only
        debugInfo.routingDecision = `ai:low_confidence:${regexResult.confidence}`
        
        try {
          const aiResult = await this.parseWithAI(
            emailText,
            language,
            classification.retailer || 'unknown'
          )
          
          debugInfo.aiResult = aiResult
          
          return {
            order: aiResult.orderData,
            confidence: aiResult.orderData?.confidence || 0,
            method: 'ai',
            processingTime: Date.now() - startTime,
            debugInfo
          }
        } catch (aiError) {
          console.error('AI parsing failed completely:', aiError)
          debugInfo.routingDecision = `failed:ai_error:${regexResult.confidence}`
          return {
            order: regexResult.order, // Return regex result as last resort
            confidence: regexResult.confidence,
            method: 'regex',
            processingTime: Date.now() - startTime,
            debugInfo
          }
        }
      }
    } catch (error) {
      console.error('Hybrid parsing error:', error)
      debugInfo.routingDecision = 'failed:parsing_error'
      return {
        order: null,
        confidence: 0,
        method: 'regex',
        processingTime: Date.now() - startTime,
        debugInfo
      }
    }
  }
  
  /**
   * Extract text content from email
   */
  private extractEmailText(email: GmailMessage): string {
    const headers = email.payload.headers || []
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
    
    let bodyText = ''
    const parts = email.payload.parts || [email.payload]
    
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText += Buffer.from(part.body.data, 'base64').toString('utf-8')
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8')
        // Simple HTML to text conversion
        bodyText += htmlContent.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ')
      }
    }
    
    return `${subject}\\n\\n${bodyText}`.trim()
  }
  
  /**
   * Classify email to determine if it's an order and identify retailer
   */
  private classifyEmail(email: GmailMessage, emailText: string): {
    isOrder: boolean
    retailer: string | null
    confidence: number
  } {
    const headers = email.payload.headers || []
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
    
    // Check if it's likely an order email
    const isOrder = shouldAnalyzeEmail({
      subject,
      from,
      body: emailText
    })
    
    if (!isOrder) {
      return { isOrder: false, retailer: null, confidence: 0 }
    }
    
    // Identify retailer from sender domain
    const retailer = this.identifyRetailer(from)
    
    return {
      isOrder: true,
      retailer,
      confidence: retailer ? 0.8 : 0.5
    }
  }
  
  /**
   * Identify retailer from sender email
   */
  private identifyRetailer(from: string): string | null {
    const fromLower = from.toLowerCase()
    
    const retailers = [
      { domains: ['coolblue.nl', 'coolblue.be'], name: 'coolblue' },
      { domains: ['amazon.nl', 'amazon.de', 'amazon.fr', 'amazon.com'], name: 'amazon' },
      { domains: ['zalando.nl', 'zalando.de', 'zalando.fr', 'zalando.com'], name: 'zalando' },
      { domains: ['bol.com', 'partnerbol.com'], name: 'bol' },
      { domains: ['otto.de'], name: 'otto' },
      { domains: ['fnac.fr', 'fnac.com'], name: 'fnac' }
    ]
    
    for (const retailer of retailers) {
      if (retailer.domains.some(domain => fromLower.includes(domain))) {
        return retailer.name
      }
    }
    
    return null
  }
  
  /**
   * Enhance regex results with AI for missing fields
   */
  private async enhanceWithAI(
    emailText: string,
    regexOrder: ParsedOrder | null,
    language: string,
    retailer: string
  ): Promise<any> {
    if (!regexOrder) return null
    
    // Identify missing fields
    const missingFields = []
    if (!regexOrder.order_number) missingFields.push('order_number')
    if (!regexOrder.amount || regexOrder.amount <= 0) missingFields.push('amount')
    if (!regexOrder.estimated_delivery) missingFields.push('estimated_delivery')
    if (!regexOrder.tracking_number) missingFields.push('tracking_number')
    
    if (missingFields.length === 0) {
      return { order: regexOrder, confidence: 1.0 }
    }
    
    // Use AI to fill missing fields only
    const geminiService = new GeminiService()
    const aiResult = await geminiService.analyzeEmail(
      {
        subject: emailText.split('\\n')[0] || '',
        from: `${retailer}@example.com`,
        date: new Date(),
        body: emailText
      },
      language
    )
    
    return aiResult
  }
  
  /**
   * Parse with AI only (when regex confidence is very low)
   */
  private async parseWithAI(
    emailText: string,
    language: string,
    retailer: string
  ): Promise<any> {
    const geminiService = new GeminiService()
    return await geminiService.analyzeEmail(
      {
        subject: emailText.split('\\n')[0] || '',
        from: `${retailer}@example.com`,
        date: new Date(),
        body: emailText
      },
      language
    )
  }
  
  /**
   * Merge regex and AI results intelligently
   */
  private mergeResults(regexOrder: ParsedOrder | null, aiResult: any): ParsedOrder | null {
    if (!regexOrder) return aiResult?.orderData || null
    if (!aiResult?.orderData) return regexOrder
    
    // Merge with preference for regex data when available
    const merged: ParsedOrder = {
      ...regexOrder,
      // Use AI data for missing fields
      order_number: regexOrder.order_number || aiResult.orderData.orderNumber || '',
      amount: regexOrder.amount > 0 ? regexOrder.amount : (aiResult.orderData.amount || 0),
      estimated_delivery: regexOrder.estimated_delivery || aiResult.orderData.estimatedDelivery,
      tracking_number: regexOrder.tracking_number || aiResult.orderData.trackingNumber,
      items: regexOrder.items || aiResult.orderData.items || [],
      // Use AI status if regex status is default
      status: regexOrder.status !== 'confirmed' ? regexOrder.status : (aiResult.orderData.status || regexOrder.status)
    }
    
    return merged
  }
  
  /**
   * Batch processing for multiple emails
   */
  async parseEmailsBatch(emails: GmailMessage[]): Promise<HybridParseResult[]> {
    const results: HybridParseResult[] = []
    const batchSize = 10 // Process in batches to avoid overwhelming the system
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const batchPromises = batch.map(email => this.parseEmail(email))
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('Batch parsing error:', result.reason)
          results.push({
            order: null,
            confidence: 0,
            method: 'regex',
            processingTime: 0,
            debugInfo: {
              language: '',
              retailer: '',
              routingDecision: 'failed:batch_error',
              confidenceThreshold: this.CONFIDENCE_THRESHOLD
            }
          })
        }
      })
    }
    
    return results
  }
  
  /**
   * Get parsing statistics
   */
  getParsingStats(results: HybridParseResult[]): {
    totalEmails: number
    successfulParses: number
    methodBreakdown: { regex: number; ai: number; hybrid: number }
    averageConfidence: number
    averageProcessingTime: number
    languageBreakdown: Record<string, number>
    retailerBreakdown: Record<string, number>
  } {
    const successful = results.filter(r => r.order !== null)
    const methodBreakdown = { regex: 0, ai: 0, hybrid: 0 }
    const languageBreakdown: Record<string, number> = {}
    const retailerBreakdown: Record<string, number> = {}
    
    results.forEach(result => {
      methodBreakdown[result.method]++
      
      const lang = result.debugInfo.language || 'unknown'
      languageBreakdown[lang] = (languageBreakdown[lang] || 0) + 1
      
      const retailer = result.debugInfo.retailer || 'unknown'
      retailerBreakdown[retailer] = (retailerBreakdown[retailer] || 0) + 1
    })
    
    return {
      totalEmails: results.length,
      successfulParses: successful.length,
      methodBreakdown,
      averageConfidence: successful.length > 0 
        ? successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length 
        : 0,
      averageProcessingTime: results.length > 0 
        ? results.reduce((sum, r) => sum + r.processingTime, 0) / results.length 
        : 0,
      languageBreakdown,
      retailerBreakdown
    }
  }
}