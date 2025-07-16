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
   * Helper method to extract basic email info
   */
  protected extractBasicInfo(email: GmailMessage): { subject: string; from: string; date: Date } {
    const headers = email.payload.headers || []
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
    const date = new Date(parseInt(email.internalDate))
    
    return { subject, from, date }
  }
  
  /**
   * Helper method to extract full email content
   */
  protected extractEmailContent(email: GmailMessage) {
    const { subject, from, date } = this.extractBasicInfo(email)
    const { htmlBody, textBody, attachments } = this.extractContent(email)
    
    return {
      subject,
      from,
      date,
      htmlBody,
      textBody,
      attachments
    }
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
   * Parse date from various formats (including Dutch)
   */
  protected parseDate(dateStr: string): Date | null {
    if (!dateStr) return null
    
    // Dutch month names
    const dutchMonths: Record<string, number> = {
      'januari': 0, 'februari': 1, 'maart': 2, 'april': 3,
      'mei': 4, 'juni': 5, 'juli': 6, 'augustus': 7,
      'september': 8, 'oktober': 9, 'november': 10, 'december': 11,
      // Abbreviations
      'jan': 0, 'feb': 1, 'mrt': 2, 'apr': 3, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'dec': 11
    }
    
    // Try to parse with Dutch month names first
    const dutchMonthPattern = /(\d{1,2})\s+(\w+)\s+(\d{4})/i
    const dutchMatch = dateStr.match(dutchMonthPattern)
    if (dutchMatch) {
      const day = parseInt(dutchMatch[1])
      const monthName = dutchMatch[2].toLowerCase()
      const year = parseInt(dutchMatch[3])
      
      if (dutchMonths.hasOwnProperty(monthName)) {
        return new Date(year, dutchMonths[monthName], day)
      }
    }
    
    // Common date patterns
    const patterns = [
      {
        pattern: /(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/,  // DD-MM-YYYY or DD/MM/YYYY
        parse: (m: RegExpMatchArray) => new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
      },
      {
        pattern: /(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/,  // YYYY-MM-DD or YYYY/MM/DD
        parse: (m: RegExpMatchArray) => new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]))
      },
      {
        pattern: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})/i,
        parse: (m: RegExpMatchArray) => new Date(dateStr)
      }
    ]
    
    for (const { pattern, parse } of patterns) {
      const match = dateStr.match(pattern)
      if (match) {
        try {
          const date = parse(match)
          if (!isNaN(date.getTime())) {
            return date
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
    
    // Last resort: try native Date parsing
    try {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date
      }
    } catch (e) {
      // Failed to parse
    }
    
    return null
  }
  
  /**
   * Extract amount from text (handles Dutch and international currency formats)
   */
  protected extractAmount(text: string): number | null {
    // Dutch format uses comma for decimals and dots for thousands: €1.234,56
    // Also handle international format: €1,234.56
    const patterns = [
      // Dutch format patterns
      /€\s*([\d.]+,\d{2})/,              // €1.234,56 (Dutch)
      /EUR\s*([\d.]+,\d{2})/,            // EUR 1.234,56
      /([\d.]+,\d{2})\s*€/,              // 1.234,56€
      /([\d.]+,\d{2})\s*EUR/,            // 1.234,56 EUR
      /totaal:?\s*€?\s*([\d.]+,\d{2})/i, // Totaal: €1.234,56
      /bedrag:?\s*€?\s*([\d.]+,\d{2})/i, // Bedrag: €1.234,56
      
      // International format patterns (fallback)
      /€\s*([\d,]+\.\d{2})/,             // €1,234.56 (International)
      /EUR\s*([\d,]+\.\d{2})/,           // EUR 1,234.56
      /([\d,]+\.\d{2})\s*€/,             // 1,234.56€
      /total:?\s*€?\s*([\d,]+\.\d{2})/i, // Total: €1,234.56
      
      // Simple amounts without decimals
      /€\s*(\d+)/,                        // €123
      /(\d+)\s*€/,                        // 123€
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        let amountStr = match[1]
        
        // Handle Dutch format (dots for thousands, comma for decimal)
        if (amountStr.includes(',') && amountStr.includes('.')) {
          // Check if it's Dutch format by position of comma
          const commaPos = amountStr.lastIndexOf(',')
          const dotPos = amountStr.lastIndexOf('.')
          
          if (commaPos > dotPos) {
            // Dutch format: 1.234,56
            amountStr = amountStr.replace(/\./g, '').replace(',', '.')
          } else {
            // International format: 1,234.56
            amountStr = amountStr.replace(/,/g, '')
          }
        } else if (amountStr.includes(',')) {
          // Only comma, could be decimal separator (Dutch) or thousand separator
          const parts = amountStr.split(',')
          if (parts.length === 2 && parts[1].length === 2) {
            // Likely decimal: 123,45
            amountStr = amountStr.replace(',', '.')
          } else {
            // Likely thousands: 1,234
            amountStr = amountStr.replace(/,/g, '')
          }
        }
        
        const amount = parseFloat(amountStr)
        if (!isNaN(amount) && amount > 0) {
          return amount
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