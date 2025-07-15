import type { EmailParser, GmailMessage } from '@/lib/types/email'
import { BaseEmailParser } from './base-parser'

/**
 * Registry for all email parsers
 * Manages parser registration and selection
 */
export class ParserRegistry {
  private static parsers: Map<string, EmailParser> = new Map()
  
  /**
   * Register a parser
   */
  static register(parser: EmailParser): void {
    const retailerName = parser.getRetailerName().toLowerCase()
    this.parsers.set(retailerName, parser)
  }
  
  /**
   * Get all registered parsers
   */
  static getAllParsers(): EmailParser[] {
    return Array.from(this.parsers.values())
  }
  
  /**
   * Find a parser that can handle the given email
   */
  static findParser(email: GmailMessage): EmailParser | null {
    for (const parser of this.parsers.values()) {
      if (parser.canParse(email)) {
        return parser
      }
    }
    return null
  }
  
  /**
   * Get a parser by retailer name
   */
  static getParser(retailerName: string): EmailParser | null {
    return this.parsers.get(retailerName.toLowerCase()) || null
  }
  
  /**
   * Get all retailer names
   */
  static getRetailerNames(): string[] {
    return Array.from(this.parsers.values()).map(p => p.getRetailerName())
  }
  
  /**
   * Clear all parsers (useful for testing)
   */
  static clear(): void {
    this.parsers.clear()
  }
}

/**
 * Email classifier that uses multiple strategies to identify retailers
 */
export class EmailClassifier {
  /**
   * Classify an email and determine which retailer it's from
   */
  static classify(email: GmailMessage): {
    retailer: string | null
    confidence: number
    parser: EmailParser | null
  } {
    // First, try to find a parser that can handle this email
    const parser = ParserRegistry.findParser(email)
    if (parser) {
      return {
        retailer: parser.getRetailerName(),
        confidence: 0.9, // High confidence if parser claims it can handle it
        parser
      }
    }
    
    // If no parser found, try to identify retailer using heuristics
    const { subject, from } = this.extractBasicInfo(email)
    const retailer = this.identifyRetailerFromSender(from) || this.identifyRetailerFromSubject(subject)
    
    return {
      retailer,
      confidence: retailer ? 0.5 : 0,
      parser: null
    }
  }
  
  /**
   * Extract basic information from email
   */
  private static extractBasicInfo(email: GmailMessage): { subject: string; from: string } {
    const headers = email.payload.headers || []
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
    
    return { subject, from }
  }
  
  /**
   * Try to identify retailer from sender email/domain
   */
  private static identifyRetailerFromSender(from: string): string | null {
    const commonRetailers: Record<string, string[]> = {
      'Amazon': ['amazon.com', 'amazon.nl', 'amazon.de'],
      'Bol.com': ['bol.com'],
      'Coolblue': ['coolblue.nl', 'coolblue.be'],
      'Zalando': ['zalando.nl', 'zalando.com', 'zalando.de'],
      'MediaMarkt': ['mediamarkt.nl', 'mediamarkt.de'],
      'Albert Heijn': ['ah.nl', 'albertheijn.nl'],
      'Jumbo': ['jumbo.com'],
      'Ikea': ['ikea.com', 'ikea.nl'],
      'Decathlon': ['decathlon.nl', 'decathlon.com'],
      'H&M': ['hm.com', 'h&m.com']
    }
    
    const fromLower = from.toLowerCase()
    
    for (const [retailer, domains] of Object.entries(commonRetailers)) {
      if (domains.some(domain => fromLower.includes(domain))) {
        return retailer
      }
    }
    
    return null
  }
  
  /**
   * Try to identify retailer from subject line
   */
  private static identifyRetailerFromSubject(subject: string): string | null {
    const subjectLower = subject.toLowerCase()
    
    // Common retailer names that might appear in subject
    const retailers = [
      'Amazon', 'Bol.com', 'Coolblue', 'Zalando', 'MediaMarkt',
      'Albert Heijn', 'Jumbo', 'Ikea', 'Decathlon', 'H&M'
    ]
    
    for (const retailer of retailers) {
      if (subjectLower.includes(retailer.toLowerCase())) {
        return retailer
      }
    }
    
    return null
  }
}