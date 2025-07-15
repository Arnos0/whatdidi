import type { GmailMessage, ParsedOrder, EmailParser } from '@/lib/types/email'
import { GmailService } from '@/lib/email/gmail-service'

/**
 * Base class for all email parsers
 * Each retailer will have its own parser extending this class
 */
export abstract class BaseEmailParser implements EmailParser {
  /**
   * Check if this parser can handle the given email
   * Based on sender domain, subject patterns, etc.
   */
  abstract canParse(email: GmailMessage): boolean
  
  /**
   * Parse the email and extract order information
   * Returns null if parsing fails
   */
  abstract parse(email: GmailMessage): Promise<ParsedOrder | null>
  
  /**
   * Get the retailer name for this parser
   */
  abstract getRetailerName(): string
  
  /**
   * Get the domains this parser handles
   */
  abstract getRetailerDomains(): string[]
  
  /**
   * Helper method to extract email content
   */
  protected extractContent(email: GmailMessage) {
    return GmailService.extractContent(email)
  }
  
  /**
   * Helper to extract amount from various formats
   */
  protected extractAmount(text: string): number | null {
    // Common patterns for amounts
    const patterns = [
      /€\s*(\d+[.,]\d{2})/,
      /EUR\s*(\d+[.,]\d{2})/,
      /\$\s*(\d+[.,]\d{2})/,
      /USD\s*(\d+[.,]\d{2})/,
      /Total[:\s]+€?\s*(\d+[.,]\d{2})/i,
      /Totaal[:\s]+€?\s*(\d+[.,]\d{2})/i, // Dutch
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return parseFloat(match[1].replace(',', '.'))
      }
    }
    
    return null
  }
  
  /**
   * Helper to extract order number from various formats
   */
  protected extractOrderNumber(text: string): string | null {
    // Common patterns for order numbers
    const patterns = [
      /Order\s*(?:#|number|nr\.?)?[:\s]*([A-Z0-9\-]+)/i,
      /Bestelling\s*(?:#|nummer|nr\.?)?[:\s]*([A-Z0-9\-]+)/i, // Dutch
      /Reference[:\s]*([A-Z0-9\-]+)/i,
      /Referentie[:\s]*([A-Z0-9\-]+)/i, // Dutch
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return null
  }
  
  /**
   * Helper to extract dates
   */
  protected extractDate(text: string): Date | null {
    // Common date patterns
    const patterns = [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/,
      /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        try {
          // Try different date formats
          const date = new Date(match[0])
          if (!isNaN(date.getTime())) {
            return date
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
    
    return null
  }
  
  /**
   * Calculate confidence score based on extracted data
   */
  protected calculateConfidence(order: Partial<ParsedOrder>): number {
    let score = 0
    const weights = {
      order_number: 0.3,
      amount: 0.3,
      order_date: 0.2,
      retailer: 0.2
    }
    
    if (order.order_number) score += weights.order_number
    if (order.amount && order.amount > 0) score += weights.amount
    if (order.order_date) score += weights.order_date
    if (order.retailer) score += weights.retailer
    
    return score
  }
}