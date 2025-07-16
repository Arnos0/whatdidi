import { BaseEmailParser } from '../base-parser'
import type { GmailMessage, ParsedOrder } from '@/lib/types/email'

export class CoolblueParser extends BaseEmailParser {
  getRetailerName(): string {
    return 'Coolblue'
  }
  
  getRetailerDomains(): string[] {
    return ['coolblue.nl', 'coolblue.be', 'no-reply@coolblue.nl']
  }
  
  canParse(email: GmailMessage): boolean {
    const { from, subject } = this.extractBasicInfo(email)
    const fromLower = from.toLowerCase()
    const subjectLower = subject.toLowerCase()
    
    // Check if from Coolblue
    if (!this.getRetailerDomains().some(domain => fromLower.includes(domain))) {
      return false
    }
    
    // Check for order-related subjects
    const orderKeywords = [
      'bestelling',      // order
      'bezorging',       // delivery
      'verzonden',       // shipped
      'onderweg',        // on the way
      'geleverd',        // delivered
      'factuur',         // invoice
      'bedankt voor je bestelling',  // thanks for your order
      'komt eraan',      // is coming
      'pakket'           // package
    ]
    
    return orderKeywords.some(keyword => subjectLower.includes(keyword))
  }
  
  async parse(email: GmailMessage): Promise<ParsedOrder | null> {
    try {
      const { subject, from, date, htmlBody, textBody } = this.extractEmailContent(email)
      const body = htmlBody || textBody
      
      if (!body) return null
      
      const order: ParsedOrder = {
        order_number: '',
        retailer: this.getRetailerName(),
        amount: 0,
        currency: 'EUR',
        order_date: date.toISOString(),
        confidence: 0
      }
      
      // Extract order number - Coolblue uses various formats
      const orderNumberPatterns = [
        /bestelnummer[:\s]+([A-Z0-9]+)/i,
        /ordernummer[:\s]+([A-Z0-9]+)/i,
        /order[:\s]+#?([A-Z0-9]+)/i,
        /nummer[:\s]+([A-Z0-9]+)/i,
        /order[:\s]+([0-9]{6,10})/i,  // Coolblue uses 6-10 digit numbers
        /\b([0-9]{8})\b/  // Often just 8 digits in the email
      ]
      
      for (const pattern of orderNumberPatterns) {
        const match = body.match(pattern)
        if (match) {
          order.order_number = match[1]
          break
        }
      }
      
      // Extract amount - Dutch format with € symbol
      const amount = this.extractAmount(body)
      if (amount) {
        order.amount = amount
      }
      
      // Extract delivery date
      const deliveryPatterns = [
        /bezorgen.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
        /levering.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
        /ontvang.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
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
      
      // Extract tracking info
      const trackingPatterns = [
        /track[\s&]*trace[:\s]+([A-Z0-9]+)/i,
        /pakketcode[:\s]+([A-Z0-9]+)/i,
        /tracking[:\s]+([A-Z0-9]+)/i
      ]
      
      for (const pattern of trackingPatterns) {
        const match = body.match(pattern)
        if (match) {
          order.tracking_number = match[1]
          break
        }
      }
      
      // Extract items if possible (Coolblue usually lists them)
      const items = []
      
      // Try to extract from subject first (e.g., "Zo ga je aan de slag met je muis")
      if (subject.toLowerCase().includes('muis')) {
        items.push({
          name: 'Computer Muis',
          quantity: 1,
          price: order.amount || 0
        })
      }
      
      // Also try common Coolblue item patterns in body
      const itemPatterns = [
        /([^€\n]+?)\s+€\s*([\d.,]+)/g,  // Item name followed by price
        /€\s*([\d.,]+)\s+([^€\n]+)/g,   // Price followed by item name
        /artikel[:\s]+([^€\n]+)/i,      // artikel: [item name]
        /product[:\s]+([^€\n]+)/i       // product: [item name]
      ]
      
      for (const pattern of itemPatterns) {
        let itemMatch
        while ((itemMatch = pattern.exec(body)) !== null) {
          const name = (pattern.source.startsWith('€') ? itemMatch[2] : itemMatch[1]).trim()
          const priceStr = pattern.source.startsWith('€') ? itemMatch[1] : itemMatch[2]
          const price = parseFloat(priceStr.replace('.', '').replace(',', '.'))
          
          if (name.length > 5 && name.length < 200 && !name.toLowerCase().includes('totaal') && !name.toLowerCase().includes('verzend')) {
            items.push({
              name: name,
              quantity: 1,
              price: price || 0
            })
          }
        }
        if (items.length > 0) break
      }
      
      if (items.length > 0) {
        order.items = items
      }
      
      // Set order status based on subject and body
      const subjectLower = subject.toLowerCase()
      const bodyLower = body.toLowerCase()
      
      // Check for specific Coolblue email types
      if (subjectLower.includes('bezorgd') || bodyLower.includes('is bezorgd') || bodyLower.includes('is geleverd')) {
        order.status = 'delivered'
      } else if (subjectLower.includes('komt naar je toe') || subjectLower.includes('onderweg') || bodyLower.includes('wordt bezorgd')) {
        order.status = 'shipped'
      } else if (subjectLower.includes('gelukt') || subjectLower.includes('bevestiging') || subjectLower.includes('bedankt voor je bestelling')) {
        order.status = 'confirmed'
      } else {
        // Default to confirmed for Coolblue emails
        order.status = 'confirmed'
      }
      
      // Calculate confidence
      order.confidence = this.calculateConfidence(order)
      
      return order
    } catch (error) {
      console.error('Error parsing Coolblue email:', error)
      return null
    }
  }
}