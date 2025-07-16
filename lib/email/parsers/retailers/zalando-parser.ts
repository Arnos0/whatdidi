import { BaseEmailParser } from '../base-parser'
import type { GmailMessage, ParsedOrder } from '@/lib/types/email'

export class ZalandoParser extends BaseEmailParser {
  getRetailerName(): string {
    return 'Zalando'
  }
  
  getRetailerDomains(): string[] {
    return ['zalando.nl', 'zalando.be', 'zalando.com', 'zalando.de', 'no-reply@zalando.nl']
  }
  
  canParse(email: GmailMessage): boolean {
    const { from, subject } = this.extractBasicInfo(email)
    const fromLower = from.toLowerCase()
    const subjectLower = subject.toLowerCase()
    
    // Check if from Zalando
    if (!this.getRetailerDomains().some(domain => fromLower.includes(domain))) {
      return false
    }
    
    // Check for order-related subjects (Zalando uses both Dutch and English)
    const orderKeywords = [
      'bestelling',          // order
      'order',              // order (English)
      'verzending',         // shipping
      'verzonden',          // shipped
      'onderweg',           // on the way
      'bezorgd',            // delivered
      'bevestiging',        // confirmation
      'factuur',            // invoice
      'je pakket',          // your package
      'jouw bestelling'     // your order
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
      
      // Extract order number - Zalando uses specific formats
      const orderNumberPatterns = [
        /bestelnummer[:\s]+([0-9\-]+)/i,
        /ordernummer[:\s]+([0-9\-]+)/i,
        /order[:\s]+#?([0-9\-]+)/i,
        /nummer[:\s]+([0-9\-]+)/i,
        /\b([0-9]{4}-[0-9]{4}-[0-9]{4})\b/  // Zalando format: xxxx-xxxx-xxxx
      ]
      
      for (const pattern of orderNumberPatterns) {
        const match = body.match(pattern)
        if (match) {
          order.order_number = match[1]
          break
        }
      }
      
      // Extract amount
      const amount = this.extractAmount(body)
      if (amount) {
        order.amount = amount
      }
      
      // Extract delivery date - Zalando provides delivery windows
      const deliveryPatterns = [
        /verwachte levering[:\s]*([^\.]+)/i,
        /geschatte levering[:\s]*([^\.]+)/i,
        /bezorging.*?(\d{1,2}[\s\-\/]\w+)/i,
        /levering.*?(\d{1,2}[\s\-\/]\w+)/i,
        /ontvang.*?tussen\s*(.+?)\s*en\s*(.+?)(?:\.|,)/i  // delivery window
      ]
      
      for (const pattern of deliveryPatterns) {
        const match = body.match(pattern)
        if (match) {
          // Handle delivery window (take the later date)
          const dateStr = match[2] || match[1]
          const deliveryDate = this.parseDate(dateStr)
          if (deliveryDate) {
            order.estimated_delivery = deliveryDate.toISOString()
          }
          break
        }
      }
      
      // Extract tracking info
      const trackingPatterns = [
        /track[:\s]*(?:&|and)?[:\s]*trace[:\s]+([A-Z0-9]+)/i,
        /tracking[:\s]+([A-Z0-9]+)/i,
        /pakket volgen[:\s]+([A-Z0-9]+)/i,
        /volg je pakket[:\s]+([A-Z0-9]+)/i
      ]
      
      for (const pattern of trackingPatterns) {
        const match = body.match(pattern)
        if (match) {
          order.tracking_number = match[1]
          order.carrier = 'DHL' // Zalando typically uses DHL in Netherlands
          break
        }
      }
      
      // Extract items - Zalando lists items clearly
      const items = []
      
      // Pattern for Zalando item listings
      const itemPatterns = [
        /([^€\n]+?)\s+€\s*([\d,]+(?:\.\d{2})?)/g,  // Item name followed by price
        /([^€\n]+?)\s+EUR\s*([\d,]+(?:\.\d{2})?)/g
      ]
      
      for (const pattern of itemPatterns) {
        let itemMatch
        while ((itemMatch = pattern.exec(body)) !== null) {
          const name = itemMatch[1].trim()
          const price = parseFloat(itemMatch[2].replace(',', '.'))
          
          // Filter out totals and shipping costs
          if (name.length > 10 && 
              name.length < 200 && 
              !name.toLowerCase().includes('totaal') &&
              !name.toLowerCase().includes('verzend') &&
              !name.toLowerCase().includes('korting')) {
            items.push({
              name: name,
              quantity: 1,
              price: price
            })
          }
        }
        
        if (items.length > 0) break
      }
      
      if (items.length > 0) {
        order.items = items
      }
      
      // Set order status based on subject and content
      const subjectLower = subject.toLowerCase()
      if (subjectLower.includes('bezorgd') || body.toLowerCase().includes('is bezorgd')) {
        order.status = 'delivered'
      } else if (subjectLower.includes('verzonden') || subjectLower.includes('onderweg')) {
        order.status = 'shipped'
      } else if (subjectLower.includes('bevestiging')) {
        order.status = 'confirmed'
      }
      
      // Calculate confidence
      order.confidence = this.calculateConfidence(order)
      
      return order
    } catch (error) {
      console.error('Error parsing Zalando email:', error)
      return null
    }
  }
}