/**
 * Hybrid retailer-specific parsing system
 * Combines regex-based parsing with AI fallback for optimal performance
 */

import type { GmailMessage, ParsedOrder } from '@/lib/types/email'
import { parseEuropeanNumber, parseEuropeanDate } from '@/lib/ai/number-parser'
import { getLanguageTerms } from '@/lib/ai/language-terms'

export interface RetailerParseResult {
  order: ParsedOrder | null
  confidence: number
  method: 'regex' | 'ai' | 'hybrid'
  debugInfo?: {
    patternsMatched: string[]
    fieldsExtracted: string[]
    language: string
  }
}

export interface RetailerParser {
  canParse(email: GmailMessage, language: string): boolean
  parseByRetailer(emailText: string, retailer: string, language: string): Promise<RetailerParseResult>
}

/**
 * Enhanced Coolblue parser with multilingual support and confidence scoring
 */
export class CoolblueMultilingualParser implements RetailerParser {
  private retailerDomains = ['coolblue.nl', 'coolblue.be', 'no-reply@coolblue.nl']
  
  canParse(email: GmailMessage, language: string): boolean {
    const headers = email.payload.headers || []
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
    
    // Check if from Coolblue
    if (!this.retailerDomains.some(domain => from.toLowerCase().includes(domain))) {
      return false
    }
    
    // Language-specific order keywords
    const orderKeywords: Record<string, string[]> = {
      nl: ['bestelling', 'bezorging', 'verzonden', 'onderweg', 'geleverd', 'factuur', 'bedankt voor je bestelling', 'komt eraan', 'pakket'],
      de: ['bestellung', 'lieferung', 'versandt', 'unterwegs', 'geliefert', 'rechnung', 'danke für ihre bestellung', 'paket'],
      fr: ['commande', 'livraison', 'expédié', 'en cours', 'livré', 'facture', 'merci pour votre commande', 'colis'],
      en: ['order', 'delivery', 'shipped', 'on the way', 'delivered', 'invoice', 'thank you for your order', 'package']
    }
    
    const keywords = orderKeywords[language] || orderKeywords['en']
    return keywords.some(keyword => subject.toLowerCase().includes(keyword))
  }
  
  async parseByRetailer(emailText: string, retailer: string, language: string): Promise<RetailerParseResult> {
    const debugInfo = {
      patternsMatched: [] as string[],
      fieldsExtracted: [] as string[],
      language
    }
    
    try {
      const order: ParsedOrder = {
        order_number: '',
        retailer: 'Coolblue',
        amount: 0,
        currency: 'EUR',
        order_date: new Date().toISOString(),
        confidence: 0,
        language
      }
      
      // Language-specific order number patterns
      const orderNumberPatterns: Record<string, RegExp[]> = {
        nl: [
          /bestelnummer[:\s]+([A-Z0-9]+)/i,
          /ordernummer[:\s]+([A-Z0-9]+)/i,
          /order[:\s]+#?([A-Z0-9]+)/i,
          /nummer[:\s]+([A-Z0-9]+)/i,
          /order[:\s]+([0-9]{6,10})/i,
          /bestelling\s*\((\d+)\)/i,  // Matches "Je bestelling (90276634)"
          /\b([0-9]{8})\b/
        ],
        de: [
          /bestellnummer[:\s]+([A-Z0-9]+)/i,
          /auftragsnummer[:\s]+([A-Z0-9]+)/i,
          /bestell-nr[:\s]+([A-Z0-9]+)/i,
          /order[:\s]+([0-9]{6,10})/i,
          /\b([0-9]{8})\b/
        ],
        fr: [
          /numéro de commande[:\s]+([A-Z0-9]+)/i,
          /n° de commande[:\s]+([A-Z0-9]+)/i,
          /référence[:\s]+([A-Z0-9]+)/i,
          /commande[:\s]+([0-9]{6,10})/i,
          /\b([0-9]{8})\b/
        ],
        en: [
          /order number[:\s]+([A-Z0-9]+)/i,
          /order[:\s]+#?([A-Z0-9]+)/i,
          /reference[:\s]+([A-Z0-9]+)/i,
          /order[:\s]+([0-9]{6,10})/i,
          /\b([0-9]{8})\b/
        ]
      }
      
      // Extract order number
      const patterns = orderNumberPatterns[language] || orderNumberPatterns['en']
      for (const pattern of patterns) {
        const match = emailText.match(pattern)
        if (match) {
          order.order_number = match[1]
          debugInfo.patternsMatched.push(`order_number: ${pattern.source}`)
          debugInfo.fieldsExtracted.push('order_number')
          break
        }
      }
      
      // Extract amount using European number parser
      const amountPatterns: Record<string, RegExp[]> = {
        nl: [
          /totaal[:\s]*€?\s*([\d.,]+)/i,
          /bedrag[:\s]*€?\s*([\d.,]+)/i,
          /prijs[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i,
          /([\d.,]+)\s*€/i
        ],
        de: [
          /gesamtbetrag[:\s]*€?\s*([\d.,]+)/i,
          /summe[:\s]*€?\s*([\d.,]+)/i,
          /betrag[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i,
          /([\d.,]+)\s*€/i
        ],
        fr: [
          /total[:\s]*€?\s*([\d.,\s]+)/i,
          /montant[:\s]*€?\s*([\d.,\s]+)/i,
          /prix[:\s]*€?\s*([\d.,\s]+)/i,
          /€\s*([\d.,\s]+)/i,
          /([\d.,\s]+)\s*€/i
        ],
        en: [
          /total[:\s]*€?\s*([\d.,]+)/i,
          /amount[:\s]*€?\s*([\d.,]+)/i,
          /price[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i,
          /([\d.,]+)\s*€/i
        ]
      }
      
      const amountPatternsForLang = amountPatterns[language as keyof typeof amountPatterns] || amountPatterns['en']
      for (const pattern of amountPatternsForLang) {
        const match = emailText.match(pattern)
        if (match) {
          const amount = parseEuropeanNumber(match[1], language)
          if (amount > 0) {
            order.amount = amount
            debugInfo.patternsMatched.push(`amount: ${pattern.source}`)
            debugInfo.fieldsExtracted.push('amount')
            break
          }
        }
      }
      
      // Extract delivery date
      const deliveryPatterns: Record<string, RegExp[]> = {
        nl: [
          /bezorgen.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /levering.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /ontvang.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /verwacht.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ],
        de: [
          /lieferung.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i,
          /versand.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i,
          /erwartet.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i,
          /zustellung.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i
        ],
        fr: [
          /livraison.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /expédition.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /attendu.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /prévu.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ],
        en: [
          /delivery.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /shipping.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /expected.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /arrival.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ]
      }
      
      const deliveryPatternsForLang = deliveryPatterns[language] || deliveryPatterns['en']
      for (const pattern of deliveryPatternsForLang) {
        const match = emailText.match(pattern)
        if (match) {
          const deliveryDate = parseEuropeanDate(match[1], language)
          if (deliveryDate) {
            order.estimated_delivery = deliveryDate
            debugInfo.patternsMatched.push(`delivery: ${pattern.source}`)
            debugInfo.fieldsExtracted.push('estimated_delivery')
            break
          }
        }
      }
      
      // Extract tracking number
      const trackingPatterns = [
        /track[\s&]*trace[:\s]+([A-Z0-9]+)/i,
        /pakketcode[:\s]+([A-Z0-9]+)/i,
        /tracking[:\s]+([A-Z0-9]+)/i,
        /sendungsnummer[:\s]+([A-Z0-9]+)/i, // German
        /suivi[:\s]+([A-Z0-9]+)/i // French
      ]
      
      for (const pattern of trackingPatterns) {
        const match = emailText.match(pattern)
        if (match) {
          order.tracking_number = match[1]
          debugInfo.patternsMatched.push(`tracking: ${pattern.source}`)
          debugInfo.fieldsExtracted.push('tracking_number')
          break
        }
      }
      
      // Determine status based on language-specific patterns
      const statusPatterns: Record<string, Record<string, string[]>> = {
        nl: {
          delivered: ['bezorgd', 'geleverd', 'afgeleverd'],
          shipped: ['verzonden', 'onderweg', 'komt naar je toe'],
          confirmed: ['bevestigd', 'geplaatst', 'bedankt voor je bestelling']
        },
        de: {
          delivered: ['geliefert', 'zugestellt', 'erhalten'],
          shipped: ['versandt', 'unterwegs', 'auf dem weg'],
          confirmed: ['bestätigt', 'aufgegeben', 'danke für ihre bestellung']
        },
        fr: {
          delivered: ['livré', 'reçu', 'arrivé'],
          shipped: ['expédié', 'en cours', 'envoyé'],
          confirmed: ['confirmé', 'passée', 'merci pour votre commande']
        },
        en: {
          delivered: ['delivered', 'arrived', 'received'],
          shipped: ['shipped', 'on the way', 'dispatched'],
          confirmed: ['confirmed', 'placed', 'thank you for your order']
        }
      }
      
      const statusPatternsForLang = statusPatterns[language as keyof typeof statusPatterns] || statusPatterns['en']
      const emailTextLower = emailText.toLowerCase()
      
      if (statusPatternsForLang.delivered.some(term => emailTextLower.includes(term))) {
        order.status = 'delivered'
        debugInfo.fieldsExtracted.push('status:delivered')
      } else if (statusPatternsForLang.shipped.some(term => emailTextLower.includes(term))) {
        order.status = 'shipped'
        debugInfo.fieldsExtracted.push('status:shipped')
      } else if (statusPatternsForLang.confirmed.some(term => emailTextLower.includes(term))) {
        order.status = 'confirmed'
        debugInfo.fieldsExtracted.push('status:confirmed')
      } else {
        order.status = 'confirmed' // Default
        debugInfo.fieldsExtracted.push('status:default')
      }
      
      // Calculate confidence based on extracted fields
      const confidence = this.calculateConfidence(order, debugInfo.fieldsExtracted)
      order.confidence = confidence
      
      return {
        order,
        confidence,
        method: 'regex',
        debugInfo
      }
      
    } catch (error) {
      console.error('Error in Coolblue multilingual parser:', error)
      return {
        order: null,
        confidence: 0,
        method: 'regex',
        debugInfo
      }
    }
  }
  
  private calculateConfidence(order: ParsedOrder, fieldsExtracted: string[]): number {
    let score = 0
    const weights = {
      order_number: 0.4,
      amount: 0.3,
      estimated_delivery: 0.1,
      tracking_number: 0.1,
      status: 0.1
    }
    
    if (order.order_number) score += weights.order_number
    if (order.amount && order.amount > 0) score += weights.amount
    if (order.estimated_delivery) score += weights.estimated_delivery
    if (order.tracking_number) score += weights.tracking_number
    if (order.status) score += weights.status
    
    return Math.min(score, 1.0)
  }
}

/**
 * Amazon multilingual parser for nl/de/fr markets
 */
export class AmazonMultilingualParser implements RetailerParser {
  private retailerDomains = ['amazon.nl', 'amazon.de', 'amazon.fr', 'amazon.com']
  
  canParse(email: GmailMessage, language: string): boolean {
    const headers = email.payload.headers || []
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
    
    // Check if from Amazon
    if (!this.retailerDomains.some(domain => from.toLowerCase().includes(domain))) {
      return false
    }
    
    // Language-specific order keywords
    const orderKeywords: Record<string, string[]> = {
      nl: ['bestelling', 'verzending', 'bezorging', 'pakket', 'geleverd'],
      de: ['bestellung', 'versand', 'lieferung', 'paket', 'geliefert'],
      fr: ['commande', 'expédition', 'livraison', 'colis', 'livré'],
      en: ['order', 'shipment', 'delivery', 'package', 'delivered']
    }
    
    const keywords = orderKeywords[language] || orderKeywords['en']
    return keywords.some(keyword => subject.toLowerCase().includes(keyword))
  }
  
  async parseByRetailer(emailText: string, retailer: string, language: string): Promise<RetailerParseResult> {
    const debugInfo = {
      patternsMatched: [] as string[],
      fieldsExtracted: [] as string[],
      language
    }
    
    try {
      const order: ParsedOrder = {
        order_number: '',
        retailer: 'Amazon',
        amount: 0,
        currency: 'EUR',
        order_date: new Date().toISOString(),
        confidence: 0,
        language
      }
      
      // Amazon-specific order number patterns for each language
      const orderNumberPatterns: Record<string, RegExp[]> = {
        nl: [
          /bestelnummer[:\s]+([A-Z0-9\-]+)/i,
          /bestellingsreferentie[:\s]+([A-Z0-9\-]+)/i,
          /amazon\.nl\/gp\/css\/order-history.*?orderID=([A-Z0-9\-]+)/i,
          /order[:\s]+#?([A-Z0-9\-]{10,})/i
        ],
        de: [
          /bestellnummer[:\s]+([A-Z0-9\-]+)/i,
          /bestellungsreferenz[:\s]+([A-Z0-9\-]+)/i,
          /amazon\.de\/gp\/css\/order-history.*?orderID=([A-Z0-9\-]+)/i,
          /bestell-nr[:\s]+([A-Z0-9\-]+)/i
        ],
        fr: [
          /numéro de commande[:\s]+([A-Z0-9\-]+)/i,
          /référence de commande[:\s]+([A-Z0-9\-]+)/i,
          /amazon\.fr\/gp\/css\/order-history.*?orderID=([A-Z0-9\-]+)/i,
          /n° de commande[:\s]+([A-Z0-9\-]+)/i
        ],
        en: [
          /order number[:\s]+([A-Z0-9\-]+)/i,
          /order[:\s]+#?([A-Z0-9\-]{10,})/i,
          /amazon\.com\/gp\/css\/order-history.*?orderID=([A-Z0-9\-]+)/i
        ]
      }
      
      // Extract order number
      const patterns = orderNumberPatterns[language] || orderNumberPatterns['en']
      for (const pattern of patterns) {
        const match = emailText.match(pattern)
        if (match) {
          order.order_number = match[1]
          debugInfo.patternsMatched.push(`order_number: ${pattern.source}`)
          debugInfo.fieldsExtracted.push('order_number')
          break
        }
      }
      
      // Extract amount (Amazon shows totals prominently)
      const amountPatterns: Record<string, RegExp[]> = {
        nl: [
          /totaal[:\s]*€?\s*([\d.,]+)/i,
          /totaalbedrag[:\s]*€?\s*([\d.,]+)/i,
          /bedrag[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i
        ],
        de: [
          /gesamtbetrag[:\s]*€?\s*([\d.,]+)/i,
          /summe[:\s]*€?\s*([\d.,]+)/i,
          /gesamt[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i
        ],
        fr: [
          /total[:\s]*€?\s*([\d.,\s]+)/i,
          /montant total[:\s]*€?\s*([\d.,\s]+)/i,
          /prix total[:\s]*€?\s*([\d.,\s]+)/i,
          /€\s*([\d.,\s]+)/i
        ],
        en: [
          /total[:\s]*€?\s*([\d.,]+)/i,
          /order total[:\s]*€?\s*([\d.,]+)/i,
          /grand total[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i
        ]
      }
      
      const amountPatternsForLang = amountPatterns[language as keyof typeof amountPatterns] || amountPatterns['en']
      for (const pattern of amountPatternsForLang) {
        const match = emailText.match(pattern)
        if (match) {
          const amount = parseEuropeanNumber(match[1], language)
          if (amount > 0) {
            order.amount = amount
            debugInfo.patternsMatched.push(`amount: ${pattern.source}`)
            debugInfo.fieldsExtracted.push('amount')
            break
          }
        }
      }
      
      // Extract delivery date
      const deliveryPatterns: Record<string, RegExp[]> = {
        nl: [
          /bezorging.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /levering.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /verwacht.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ],
        de: [
          /lieferung.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i,
          /versand.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i,
          /erwartet.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i
        ],
        fr: [
          /livraison.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /expédition.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /attendu.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ],
        en: [
          /delivery.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /shipping.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /expected.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ]
      }
      
      const deliveryPatternsForLang = deliveryPatterns[language] || deliveryPatterns['en']
      for (const pattern of deliveryPatternsForLang) {
        const match = emailText.match(pattern)
        if (match) {
          const deliveryDate = parseEuropeanDate(match[1], language)
          if (deliveryDate) {
            order.estimated_delivery = deliveryDate
            debugInfo.patternsMatched.push(`delivery: ${pattern.source}`)
            debugInfo.fieldsExtracted.push('estimated_delivery')
            break
          }
        }
      }
      
      // Determine status
      const statusPatterns = {
        nl: {
          delivered: ['bezorgd', 'geleverd', 'afgeleverd'],
          shipped: ['verzonden', 'onderweg', 'verstuurd'],
          confirmed: ['bevestigd', 'geplaatst', 'bedankt voor je bestelling']
        },
        de: {
          delivered: ['geliefert', 'zugestellt', 'erhalten'],
          shipped: ['versandt', 'unterwegs', 'auf dem weg'],
          confirmed: ['bestätigt', 'aufgegeben', 'danke für ihre bestellung']
        },
        fr: {
          delivered: ['livré', 'reçu', 'arrivé'],
          shipped: ['expédié', 'en cours', 'envoyé'],
          confirmed: ['confirmé', 'passée', 'merci pour votre commande']
        },
        en: {
          delivered: ['delivered', 'arrived', 'received'],
          shipped: ['shipped', 'on the way', 'dispatched'],
          confirmed: ['confirmed', 'placed', 'thank you for your order']
        }
      }
      
      const statusPatternsForLang = statusPatterns[language as keyof typeof statusPatterns] || statusPatterns['en']
      const emailTextLower = emailText.toLowerCase()
      
      if (statusPatternsForLang.delivered.some(term => emailTextLower.includes(term))) {
        order.status = 'delivered'
        debugInfo.fieldsExtracted.push('status:delivered')
      } else if (statusPatternsForLang.shipped.some(term => emailTextLower.includes(term))) {
        order.status = 'shipped'
        debugInfo.fieldsExtracted.push('status:shipped')
      } else if (statusPatternsForLang.confirmed.some(term => emailTextLower.includes(term))) {
        order.status = 'confirmed'
        debugInfo.fieldsExtracted.push('status:confirmed')
      } else {
        order.status = 'confirmed' // Default
        debugInfo.fieldsExtracted.push('status:default')
      }
      
      // Calculate confidence
      const confidence = this.calculateConfidence(order, debugInfo.fieldsExtracted)
      order.confidence = confidence
      
      return {
        order,
        confidence,
        method: 'regex',
        debugInfo
      }
      
    } catch (error) {
      console.error('Error in Amazon multilingual parser:', error)
      return {
        order: null,
        confidence: 0,
        method: 'regex',
        debugInfo
      }
    }
  }
  
  private calculateConfidence(order: ParsedOrder, fieldsExtracted: string[]): number {
    let score = 0
    const weights = {
      order_number: 0.4,
      amount: 0.3,
      estimated_delivery: 0.1,
      tracking_number: 0.1,
      status: 0.1
    }
    
    if (order.order_number) score += weights.order_number
    if (order.amount && order.amount > 0) score += weights.amount
    if (order.estimated_delivery) score += weights.estimated_delivery
    if (order.tracking_number) score += weights.tracking_number
    if (order.status) score += weights.status
    
    return Math.min(score, 1.0)
  }
}

/**
 * Main function to parse emails by retailer with confidence-based routing
 */
export async function parseByRetailer(
  emailText: string,
  retailer: string,
  language: string,
  email: GmailMessage
): Promise<RetailerParseResult> {
  const retailerParsers = {
    'coolblue': new CoolblueMultilingualParser(),
    'amazon': new AmazonMultilingualParser(),
    'zalando': new ZalandoMultilingualParser()
  }
  
  const retailerKey = retailer.toLowerCase()
  const parser = retailerParsers[retailerKey as keyof typeof retailerParsers]
  
  if (!parser) {
    return {
      order: null,
      confidence: 0,
      method: 'regex',
      debugInfo: {
        patternsMatched: [],
        fieldsExtracted: [],
        language
      }
    }
  }
  
  if (!parser.canParse(email, language)) {
    return {
      order: null,
      confidence: 0,
      method: 'regex',
      debugInfo: {
        patternsMatched: [],
        fieldsExtracted: [],
        language
      }
    }
  }
  
  return await parser.parseByRetailer(emailText, retailer, language)
}

/**
 * Zalando multilingual parser for nl/de/fr markets
 */
export class ZalandoMultilingualParser implements RetailerParser {
  private retailerDomains = ['zalando.nl', 'zalando.de', 'zalando.fr', 'zalando.com', 'zalando.be']
  
  canParse(email: GmailMessage, language: string): boolean {
    const headers = email.payload.headers || []
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
    
    // Check if from Zalando
    if (!this.retailerDomains.some(domain => from.toLowerCase().includes(domain))) {
      return false
    }
    
    // Language-specific order keywords
    const orderKeywords: Record<string, string[]> = {
      nl: ['bestelling', 'verzending', 'bezorging', 'pakket', 'geleverd', 'retour'],
      de: ['bestellung', 'versand', 'lieferung', 'paket', 'geliefert', 'retoure'],
      fr: ['commande', 'expédition', 'livraison', 'colis', 'livré', 'retour'],
      en: ['order', 'shipment', 'delivery', 'package', 'delivered', 'return']
    }
    
    const keywords = orderKeywords[language] || orderKeywords['en']
    return keywords.some(keyword => subject.toLowerCase().includes(keyword))
  }
  
  async parseByRetailer(emailText: string, retailer: string, language: string): Promise<RetailerParseResult> {
    const debugInfo = {
      patternsMatched: [] as string[],
      fieldsExtracted: [] as string[],
      language
    }
    
    try {
      const order: ParsedOrder = {
        order_number: '',
        retailer: 'Zalando',
        amount: 0,
        currency: 'EUR',
        order_date: new Date().toISOString(),
        confidence: 0,
        language
      }
      
      // Zalando-specific order number patterns
      const orderNumberPatterns: Record<string, RegExp[]> = {
        nl: [
          /bestelnummer[:\s]+([A-Z0-9\-]+)/i,
          /order[:\s]+#?([A-Z0-9\-]+)/i,
          /zalando[:\s]+([A-Z0-9\-]+)/i,
          /\b([A-Z0-9]{8,}-[A-Z0-9]{4,})\b/i, // Zalando format: XXXXXXXX-XXXX
          /referentie[:\s]+([A-Z0-9\-]+)/i
        ],
        de: [
          /bestellnummer[:\s]+([A-Z0-9\-]+)/i,
          /bestell-nr[:\s]+([A-Z0-9\-]+)/i,
          /order[:\s]+#?([A-Z0-9\-]+)/i,
          /zalando[:\s]+([A-Z0-9\-]+)/i,
          /\b([A-Z0-9]{8,}-[A-Z0-9]{4,})\b/i,
          /referenz[:\s]+([A-Z0-9\-]+)/i
        ],
        fr: [
          /numéro de commande[:\s]+([A-Z0-9\-]+)/i,
          /n° de commande[:\s]+([A-Z0-9\-]+)/i,
          /commande[:\s]+#?([A-Z0-9\-]+)/i,
          /zalando[:\s]+([A-Z0-9\-]+)/i,
          /\b([A-Z0-9]{8,}-[A-Z0-9]{4,})\b/i,
          /référence[:\s]+([A-Z0-9\-]+)/i
        ],
        en: [
          /order number[:\s]+([A-Z0-9\-]+)/i,
          /order[:\s]+#?([A-Z0-9\-]+)/i,
          /zalando[:\s]+([A-Z0-9\-]+)/i,
          /\b([A-Z0-9]{8,}-[A-Z0-9]{4,})\b/i,
          /reference[:\s]+([A-Z0-9\-]+)/i
        ]
      }
      
      // Extract order number
      const patterns = orderNumberPatterns[language] || orderNumberPatterns['en']
      for (const pattern of patterns) {
        const match = emailText.match(pattern)
        if (match) {
          order.order_number = match[1]
          debugInfo.patternsMatched.push(`order_number: ${pattern.source}`)
          debugInfo.fieldsExtracted.push('order_number')
          break
        }
      }
      
      // Extract amount
      const amountPatterns = {
        nl: [
          /totaal[:\s]*€?\s*([\d.,]+)/i,
          /totaalbedrag[:\s]*€?\s*([\d.,]+)/i,
          /bedrag[:\s]*€?\s*([\d.,]+)/i,
          /orderwaarde[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i,
          /([\d.,]+)\s*€/i
        ],
        de: [
          /gesamtbetrag[:\s]*€?\s*([\d.,]+)/i,
          /gesamtsumme[:\s]*€?\s*([\d.,]+)/i,
          /bestellwert[:\s]*€?\s*([\d.,]+)/i,
          /summe[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i,
          /([\d.,]+)\s*€/i
        ],
        fr: [
          /total[:\s]*€?\s*([\d.,\s]+)/i,
          /montant total[:\s]*€?\s*([\d.,\s]+)/i,
          /valeur commande[:\s]*€?\s*([\d.,\s]+)/i,
          /prix total[:\s]*€?\s*([\d.,\s]+)/i,
          /€\s*([\d.,\s]+)/i,
          /([\d.,\s]+)\s*€/i
        ],
        en: [
          /total[:\s]*€?\s*([\d.,]+)/i,
          /order total[:\s]*€?\s*([\d.,]+)/i,
          /order value[:\s]*€?\s*([\d.,]+)/i,
          /grand total[:\s]*€?\s*([\d.,]+)/i,
          /€\s*([\d.,]+)/i,
          /([\d.,]+)\s*€/i
        ]
      }
      
      const amountPatternsForLang = amountPatterns[language as keyof typeof amountPatterns] || amountPatterns['en']
      for (const pattern of amountPatternsForLang) {
        const match = emailText.match(pattern)
        if (match) {
          const amount = parseEuropeanNumber(match[1], language)
          if (amount > 0) {
            order.amount = amount
            debugInfo.patternsMatched.push(`amount: ${pattern.source}`)
            debugInfo.fieldsExtracted.push('amount')
            break
          }
        }
      }
      
      // Extract delivery date
      const deliveryPatterns: Record<string, RegExp[]> = {
        nl: [
          /levering.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /bezorging.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /verwacht.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /ontvang.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ],
        de: [
          /lieferung.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i,
          /versand.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i,
          /erwartet.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i,
          /zustellung.*?(\d{1,2}[\s\-\/\.]\w+[\s\-\/\.]\d{2,4})/i
        ],
        fr: [
          /livraison.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /expédition.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /attendu.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /prévu.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ],
        en: [
          /delivery.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /shipping.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /expected.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i,
          /arrival.*?(\d{1,2}[\s\-\/]\w+[\s\-\/]\d{2,4})/i
        ]
      }
      
      const deliveryPatternsForLang = deliveryPatterns[language] || deliveryPatterns['en']
      for (const pattern of deliveryPatternsForLang) {
        const match = emailText.match(pattern)
        if (match) {
          const deliveryDate = parseEuropeanDate(match[1], language)
          if (deliveryDate) {
            order.estimated_delivery = deliveryDate
            debugInfo.patternsMatched.push(`delivery: ${pattern.source}`)
            debugInfo.fieldsExtracted.push('estimated_delivery')
            break
          }
        }
      }
      
      // Extract tracking number (Zalando uses various carriers)
      const trackingPatterns = [
        /track[\s&]*trace[:\s]+([A-Z0-9]+)/i,
        /tracking[:\s]+([A-Z0-9]+)/i,
        /sendungsnummer[:\s]+([A-Z0-9]+)/i, // German
        /suivi[:\s]+([A-Z0-9]+)/i, // French
        /volg[:\s]+([A-Z0-9]+)/i, // Dutch
        /pakket[:\s]+([A-Z0-9]+)/i,
        /dhl[:\s]+([A-Z0-9]+)/i,
        /ups[:\s]+([A-Z0-9]+)/i,
        /dpd[:\s]+([A-Z0-9]+)/i
      ]
      
      for (const pattern of trackingPatterns) {
        const match = emailText.match(pattern)
        if (match) {
          order.tracking_number = match[1]
          debugInfo.patternsMatched.push(`tracking: ${pattern.source}`)
          debugInfo.fieldsExtracted.push('tracking_number')
          break
        }
      }
      
      // Determine status
      const statusPatterns = {
        nl: {
          delivered: ['bezorgd', 'geleverd', 'afgeleverd', 'ontvangen'],
          shipped: ['verzonden', 'onderweg', 'verstuurd', 'komt eraan'],
          confirmed: ['bevestigd', 'geplaatst', 'ontvangen', 'bedankt voor je bestelling'],
          returned: ['retour', 'teruggestuurd', 'geretourneerd']
        },
        de: {
          delivered: ['geliefert', 'zugestellt', 'erhalten', 'angekommen'],
          shipped: ['versandt', 'unterwegs', 'auf dem weg', 'kommt'],
          confirmed: ['bestätigt', 'aufgegeben', 'erhalten', 'danke für ihre bestellung'],
          returned: ['retoure', 'zurückgesandt', 'retourniert']
        },
        fr: {
          delivered: ['livré', 'reçu', 'arrivé', 'récupéré'],
          shipped: ['expédié', 'en cours', 'envoyé', 'arrive'],
          confirmed: ['confirmé', 'passée', 'reçue', 'merci pour votre commande'],
          returned: ['retour', 'retourné', 'renvoyé']
        },
        en: {
          delivered: ['delivered', 'arrived', 'received', 'collected'],
          shipped: ['shipped', 'on the way', 'dispatched', 'coming'],
          confirmed: ['confirmed', 'placed', 'received', 'thank you for your order'],
          returned: ['returned', 'sent back', 'refunded']
        }
      }
      
      const statusPatternsForLang = statusPatterns[language as keyof typeof statusPatterns] || statusPatterns['en']
      const emailTextLower = emailText.toLowerCase()
      
      if (statusPatternsForLang.delivered.some(term => emailTextLower.includes(term))) {
        order.status = 'delivered'
        debugInfo.fieldsExtracted.push('status:delivered')
      } else if (statusPatternsForLang.shipped.some(term => emailTextLower.includes(term))) {
        order.status = 'shipped'
        debugInfo.fieldsExtracted.push('status:shipped')
      } else if (statusPatternsForLang.returned.some(term => emailTextLower.includes(term))) {
        order.status = 'delivered'
        debugInfo.fieldsExtracted.push('status:returned')
      } else if (statusPatternsForLang.confirmed.some(term => emailTextLower.includes(term))) {
        order.status = 'confirmed'
        debugInfo.fieldsExtracted.push('status:confirmed')
      } else {
        order.status = 'confirmed' // Default
        debugInfo.fieldsExtracted.push('status:default')
      }
      
      // Calculate confidence
      const confidence = this.calculateConfidence(order, debugInfo.fieldsExtracted)
      order.confidence = confidence
      
      return {
        order,
        confidence,
        method: 'regex',
        debugInfo
      }
      
    } catch (error) {
      console.error('Error in Zalando multilingual parser:', error)
      return {
        order: null,
        confidence: 0,
        method: 'regex',
        debugInfo
      }
    }
  }
  
  private calculateConfidence(order: ParsedOrder, fieldsExtracted: string[]): number {
    let score = 0
    const weights = {
      order_number: 0.4,
      amount: 0.3,
      estimated_delivery: 0.1,
      tracking_number: 0.1,
      status: 0.1
    }
    
    if (order.order_number) score += weights.order_number
    if (order.amount && order.amount > 0) score += weights.amount
    if (order.estimated_delivery) score += weights.estimated_delivery
    if (order.tracking_number) score += weights.tracking_number
    if (order.status) score += weights.status
    
    return Math.min(score, 1.0)
  }
}