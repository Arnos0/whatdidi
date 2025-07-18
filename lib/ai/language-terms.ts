/**
 * Language-specific terms for AI prompt generation
 * Used to dynamically build prompts based on detected email language
 */

export interface LanguageTerms {
  orderTerms: string[]
  totalTerms: string[]
  deliveryTerms: string[]
  statusTerms: {
    confirmed: string[]
    shipped: string[]
    delivered: string[]
  }
  currencySymbols: string[]
  dateFormats: string[]
  commonPhrases: {
    yourOrder: string[]
    thankYou: string[]
    trackingInfo: string[]
  }
}

// MVP: Only English and Dutch support
export const LANGUAGE_TERMS: Record<string, LanguageTerms> = {
  nl: {
    orderTerms: ['bestelnummer', 'ordernummer', 'order number', 'order #', 'bestelling #', 'referentienummer', 'track & trace', 'trackingnummer', 'zendingsnummer', 'pakketcode'],
    totalTerms: ['totaal', 'totaalbedrag', 'te betalen', 'bedrag', 'prijs'],
    deliveryTerms: ['bezorging', 'levering', 'verzending', 'verwachte leverdatum', 'afleveradres', 'wordt bezorgd', 'onderweg naar', 'aflevering gepland'],
    statusTerms: {
      confirmed: ['bevestigd', 'geplaatst', 'ontvangen'],
      shipped: ['verzonden', 'verstuurd', 'onderweg', 'komt eraan', 'in transit', 'bij de bezorger'],
      delivered: ['afgeleverd', 'bezorgd', 'geleverd', 'ontvangen', 'afgehaald']
    },
    currencySymbols: ['EUR', '€', 'euro'],
    dateFormats: ['dd-mm-yyyy', 'dd/mm/yyyy'],
    commonPhrases: {
      yourOrder: ['je bestelling', 'uw bestelling', 'uw order', 'je pakket', 'uw zending'],
      thankYou: ['bedankt voor je bestelling', 'dank je wel', 'hartelijk dank'],
      trackingInfo: ['volg je pakket', 'track & trace', 'traceer je bestelling', 'volg je zending']
    }
  },
  en: {
    orderTerms: ['order number', 'order #', 'order id', 'reference number', 'order reference'],
    totalTerms: ['total', 'amount', 'total amount', 'amount due', 'grand total'],
    deliveryTerms: ['delivery', 'shipping', 'estimated delivery', 'arrival', 'delivery address'],
    statusTerms: {
      confirmed: ['confirmed', 'placed', 'received'],
      shipped: ['shipped', 'sent', 'on the way', 'dispatched'],
      delivered: ['delivered', 'arrived', 'received']
    },
    currencySymbols: ['EUR', '€'],
    dateFormats: ['mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy-mm-dd'],
    commonPhrases: {
      yourOrder: ['your order', 'your purchase'],
      thankYou: ['thank you for your order', 'thanks', 'thank you'],
      trackingInfo: ['track your package', 'tracking information', 'track order']
    }
  }
}

/**
 * Get language-specific terms for prompt generation
 */
export function getLanguageTerms(language: string): LanguageTerms {
  return LANGUAGE_TERMS[language] || LANGUAGE_TERMS['en']
}

/**
 * Build language-specific examples for the AI prompt
 * MVP: Only English and Dutch examples
 */
export function buildLanguageExamples(language: string): string {
  const examples: Record<string, string> = {
    nl: `
Voorbeelden:
- "Bestelnummer: 123456" → orderNumber: "123456"
- "Bestelling (90276634)" in onderwerp → orderNumber: "90276634"
- "Totaalbedrag: €89,99" → amount: 89.99, currency: "EUR"
- "Totaal € 85,00" → amount: 85.00, currency: "EUR"
- "Bezorging: 15 januari" → estimatedDelivery: "2025-01-15"
- "Je bestelling is verzonden" → status: "shipped"
- "Pakket is onderweg" → status: "shipped"
- "Je bestelling is afgeleverd" → status: "delivered"
- DHL email met "Track & Trace: 12345" → trackingNumber: "12345", carrier: "DHL"
- PostNL zonder bedrag → amount: null, isOrder: true (nog steeds geldig!)
- "Pakket van Coolblue" → retailer: "Coolblue"
- "Je bestelling bij Bol.com" → retailer: "Bol.com"

Let op Dutch number formats:
- "1.234,56" → 1234.56 (duizend komma)
- "89,99" → 89.99 (decimale komma)`,
    
    en: `
Examples:
- "Order number: 123456" → orderNumber: "123456"
- "Order #123456" in subject → orderNumber: "123456"
- "Total: €89.99" → amount: 89.99, currency: "EUR"
- "Order Total: $125.50" → amount: 125.50, currency: "USD"
- "Delivery: January 15" → estimatedDelivery: "2025-01-15"
- "Your order has been shipped" → status: "shipped"
- "Package is on the way" → status: "shipped"
- "Your order was delivered" → status: "delivered"
- DHL email with "Tracking: 12345" → trackingNumber: "12345", carrier: "DHL"
- UPS without amount → amount: null, isOrder: true (still valid!)
- "Your Amazon order" → retailer: "Amazon"
- "Thank you for shopping at Zalando" → retailer: "Zalando"`
  }
  
  return examples[language] || examples['en']
}