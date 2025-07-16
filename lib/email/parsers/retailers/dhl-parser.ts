import { BaseEmailParser } from '../base-parser'
import type { GmailMessage, ParsedOrder } from '@/lib/types/email'

export class DHLParser extends BaseEmailParser {
  getRetailerName(): string {
    return 'DHL'
  }
  
  getRetailerDomains(): string[] {
    return [
      'dhl.nl', 
      'dhl.com', 
      'dhlparcel.nl',
      'dhl-parcel.nl',
      'no-reply@dhl.nl',
      'noreply@dhl.com'
    ]
  }
  
  canParse(email: GmailMessage): boolean {
    const { from, subject } = this.extractBasicInfo(email)
    const fromLower = from.toLowerCase()
    const subjectLower = subject.toLowerCase()
    
    // Check if from DHL
    const isDHL = this.getRetailerDomains().some(domain => fromLower.includes(domain))
    
    // Also check for DHL tracking patterns in subject (for emails forwarded by retailers)
    const hasDHLTracking = /JVGL\d{16}/.test(subject) || subjectLower.includes('dhl')
    
    return isDHL || hasDHLTracking
  }
  
  async parse(email: GmailMessage): Promise<ParsedOrder | null> {
    try {
      const { subject, from, date, htmlBody, textBody } = this.extractEmailContent(email)
      const body = htmlBody || textBody
      
      if (!body) return null
      
      // DHL emails are usually tracking updates, not orders
      // We'll extract tracking info and try to link to existing orders
      const order: ParsedOrder = {
        order_number: '',
        retailer: 'DHL Tracking',
        amount: 0,
        currency: 'EUR',
        order_date: date.toISOString(),
        confidence: 0
      }
      
      // Extract tracking number - DHL uses JVGL format
      const trackingPatterns = [
        /JVGL\d{16}/,  // Standard DHL tracking format
        /pakket[:\s]+([A-Z0-9]+)/i,
        /tracking[:\s]+([A-Z0-9]+)/i,
        /zending[:\s]+([A-Z0-9]+)/i,
        /barcode[:\s]+([A-Z0-9]+)/i
      ]
      
      for (const pattern of trackingPatterns) {
        const match = subject.match(pattern) || body.match(pattern)
        if (match) {
          order.tracking_number = match[0] || match[1]
          break
        }
      }
      
      // Try to extract retailer info from the email
      const retailerPatterns = [
        /voor\s+(.+?)\s+(?:wordt|is)/i,  // "voor [retailer] wordt bezorgd"
        /namens\s+(.+?)\s+(?:wordt|is)/i, // "namens [retailer]"
        /bestelling\s+(?:van|bij)\s+(.+?)(?:\.|,|\s+wordt)/i  // "bestelling van/bij [retailer]"
      ]
      
      for (const pattern of retailerPatterns) {
        const match = body.match(pattern)
        if (match && match[1]) {
          // Clean up retailer name
          const retailer = match[1].trim().replace(/\s+/g, ' ')
          if (retailer.length < 50) { // Reasonable retailer name
            order.retailer = retailer
          }
          break
        }
      }
      
      // Set delivery status based on email content
      const subjectLower = subject.toLowerCase()
      const bodyLower = body.toLowerCase()
      
      if (subjectLower.includes('bezorgd') || bodyLower.includes('is bezorgd') || bodyLower.includes('afgeleverd')) {
        order.status = 'delivered'
      } else if (subjectLower.includes('onderweg') || bodyLower.includes('wordt bezorgd') || bodyLower.includes('komt eraan')) {
        order.status = 'shipped'
      } else {
        order.status = 'shipped' // Default for DHL emails
      }
      
      // Extract delivery date if mentioned
      const deliveryPatterns = [
        /bezorg.*?(\d{1,2}[\s\-\/]\w+)/i,
        /lever.*?(\d{1,2}[\s\-\/]\w+)/i,
        /komt.*?(\d{1,2}[\s\-\/]\w+)/i,
        /tussen\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i  // delivery window
      ]
      
      for (const pattern of deliveryPatterns) {
        const match = body.match(pattern)
        if (match) {
          const deliveryDate = this.parseDate(match[1])
          if (deliveryDate) {
            order.estimated_delivery = deliveryDate.toISOString()
          }
          break
        }
      }
      
      // DHL emails don't contain order numbers or amounts
      // We'll use the tracking number as a pseudo order number for now
      if (order.tracking_number) {
        order.order_number = `DHL-${order.tracking_number}`
        order.carrier = 'DHL'
      }
      
      // Calculate confidence
      order.confidence = this.calculateConfidence(order)
      
      return order
    } catch (error) {
      console.error('Error parsing DHL email:', error)
      return null
    }
  }
}