import { BaseEmailParser } from '../base-parser'
import type { GmailMessage, ParsedOrder } from '@/lib/types/email'

/**
 * Parser for Bol.com order confirmation emails
 */
export class BolParser extends BaseEmailParser {
  getRetailerName(): string {
    return 'Bol.com'
  }
  
  getRetailerDomains(): string[] {
    return ['bol.com']
  }
  
  canParse(email: GmailMessage): boolean {
    const { subject, from } = this.extractContent(email)
    
    // Check if from Bol.com
    if (!from.toLowerCase().includes('bol.com')) {
      return false
    }
    
    // Check for order confirmation patterns in Dutch
    const orderPatterns = [
      'bestelbevestiging',
      'order bevestiging',
      'je bestelling',
      'bestelnummer',
      'order confirmation'
    ]
    
    const subjectLower = subject.toLowerCase()
    return orderPatterns.some(pattern => subjectLower.includes(pattern))
  }
  
  async parse(email: GmailMessage): Promise<ParsedOrder | null> {
    try {
      const { htmlBody, textBody, subject, date } = this.extractContent(email)
      const content = htmlBody || textBody
      
      if (!content) {
        return null
      }
      
      // Extract order number
      // Bol.com format: usually starts with 3 or 4 followed by numbers
      const orderNumberMatch = content.match(/(?:Bestelnummer|Order number)[:\s]*([34]\d{7,9})/i) ||
                              content.match(/\b([34]\d{7,9})\b/)
      const orderNumber = orderNumberMatch?.[1] || null
      
      if (!orderNumber) {
        return null
      }
      
      // Extract amount
      // Look for total amount patterns
      const amountMatch = content.match(/(?:Totaal|Total)[:\s]*€\s*(\d+[,.]?\d*)/i) ||
                         content.match(/€\s*(\d+[,.]?\d*)\s*(?:totaal|total)/i)
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null
      
      if (!amount) {
        return null
      }
      
      // Extract delivery date if available
      const deliveryMatch = content.match(/(?:Bezorging|Delivery|Levering)[:\s]*([^<\n]+)/i)
      const estimatedDelivery = deliveryMatch ? this.extractDate(deliveryMatch[1])?.toISOString() : null
      
      // Extract items if possible
      const items = this.extractItems(content)
      
      const order: ParsedOrder = {
        order_number: orderNumber,
        retailer: this.getRetailerName(),
        amount,
        currency: 'EUR',
        order_date: date.toISOString(),
        estimated_delivery: estimatedDelivery,
        tracking_number: null, // Usually sent in separate email
        carrier: null,
        items,
        confidence: this.calculateConfidence({
          order_number: orderNumber,
          amount,
          order_date: date.toISOString(),
          retailer: this.getRetailerName()
        })
      }
      
      return order
    } catch (error) {
      console.error('Error parsing Bol.com email:', error)
      return null
    }
  }
  
  private extractItems(content: string): ParsedOrder['items'] {
    const items: ParsedOrder['items'] = []
    
    // Simplified item extraction - this would need more sophisticated parsing
    // Bol.com usually lists items in a table or structured format
    const itemPattern = /(\d+)\s*x\s*([^€]+)€\s*(\d+[,.]?\d*)/g
    let match
    
    while ((match = itemPattern.exec(content)) !== null) {
      items.push({
        name: match[2].trim(),
        quantity: parseInt(match[1]),
        price: parseFloat(match[3].replace(',', '.'))
      })
    }
    
    return items.length > 0 ? items : undefined
  }
}