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

export const LANGUAGE_TERMS: Record<string, LanguageTerms> = {
  nl: {
    orderTerms: ['bestelnummer', 'ordernummer', 'order number', 'order #', 'bestelling #'],
    totalTerms: ['totaal', 'totaalbedrag', 'te betalen', 'bedrag', 'prijs'],
    deliveryTerms: ['bezorging', 'levering', 'verzending', 'verwachte leverdatum', 'afleveradres'],
    statusTerms: {
      confirmed: ['bevestigd', 'geplaatst', 'ontvangen'],
      shipped: ['verzonden', 'verstuurd', 'onderweg', 'komt eraan'],
      delivered: ['afgeleverd', 'bezorgd', 'geleverd', 'ontvangen']
    },
    currencySymbols: ['EUR', '€', 'euro'],
    dateFormats: ['dd-mm-yyyy', 'dd/mm/yyyy'],
    commonPhrases: {
      yourOrder: ['je bestelling', 'uw bestelling', 'uw order'],
      thankYou: ['bedankt voor je bestelling', 'dank je wel', 'hartelijk dank'],
      trackingInfo: ['volg je pakket', 'track & trace', 'traceer je bestelling']
    }
  },
  de: {
    orderTerms: ['bestellnummer', 'auftragsnummer', 'ordernummer', 'bestell-nr', 'order nummer'],
    totalTerms: ['gesamtbetrag', 'summe', 'gesamt', 'zu zahlen', 'betrag', 'preis'],
    deliveryTerms: ['lieferung', 'versand', 'zustellung', 'liefertermin', 'lieferadresse'],
    statusTerms: {
      confirmed: ['bestätigt', 'aufgegeben', 'erhalten'],
      shipped: ['versendet', 'versandt', 'unterwegs', 'auf dem weg'],
      delivered: ['geliefert', 'zugestellt', 'erhalten', 'angekommen']
    },
    currencySymbols: ['EUR', '€', 'euro'],
    dateFormats: ['dd.mm.yyyy', 'dd/mm/yyyy'],
    commonPhrases: {
      yourOrder: ['ihre bestellung', 'deine bestellung', 'ihre order'],
      thankYou: ['vielen dank für ihre bestellung', 'danke', 'herzlichen dank'],
      trackingInfo: ['sendungsverfolgung', 'paket verfolgen', 'tracking']
    }
  },
  fr: {
    orderTerms: ['numéro de commande', 'n° de commande', 'référence commande', 'numéro commande'],
    totalTerms: ['total', 'montant total', 'à payer', 'montant dû', 'prix total'],
    deliveryTerms: ['livraison', 'expédition', 'date de livraison', 'délai', 'adresse de livraison'],
    statusTerms: {
      confirmed: ['confirmé', 'confirmée', 'passée', 'reçue'],
      shipped: ['expédié', 'expédiée', 'en cours', 'envoyé'],
      delivered: ['livré', 'livrée', 'reçu', 'arrivé']
    },
    currencySymbols: ['EUR', '€', 'euro'],
    dateFormats: ['dd/mm/yyyy', 'dd-mm-yyyy'],
    commonPhrases: {
      yourOrder: ['votre commande', 'votre order'],
      thankYou: ['merci pour votre commande', 'merci', 'nous vous remercions'],
      trackingInfo: ['suivi de colis', 'suivre votre commande', 'tracking']
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
    currencySymbols: ['EUR', '€', 'USD', '$', 'GBP', '£'],
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
 */
export function buildLanguageExamples(language: string): string {
  const terms = getLanguageTerms(language)
  
  const examples: Record<string, string> = {
    nl: `
Bijvoorbeeld:
- "Bestelnummer: 123456" → orderNumber: "123456"
- "Totaalbedrag: €89,99" → amount: 89.99, currency: "EUR"
- "Bezorging: 15 januari" → estimatedDelivery: "2025-01-15"
- "Je bestelling is verzonden" → status: "shipped"`,
    
    de: `
Beispiel:
- "Bestellnummer: 123456" → orderNumber: "123456"
- "Gesamtbetrag: €89,99" → amount: 89.99, currency: "EUR"
- "Lieferung: 15. Januar" → estimatedDelivery: "2025-01-15"
- "Ihre Bestellung wurde versandt" → status: "shipped"`,
    
    fr: `
Exemple:
- "Numéro de commande: 123456" → orderNumber: "123456"
- "Total: 89,99€" → amount: 89.99, currency: "EUR"
- "Livraison: 15 janvier" → estimatedDelivery: "2025-01-15"
- "Votre commande a été expédiée" → status: "shipped"`,
    
    en: `
Example:
- "Order number: 123456" → orderNumber: "123456"
- "Total: €89.99" → amount: 89.99, currency: "EUR"
- "Delivery: January 15" → estimatedDelivery: "2025-01-15"
- "Your order has been shipped" → status: "shipped"`
  }
  
  return examples[language] || examples['en']
}