/**
 * Status mapping utility for MVP (English/Dutch)
 * Maps status terms from emails to standardized values
 */

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface StatusMapping {
  pattern: RegExp
  status: OrderStatus
}

// Status mappings for English
const ENGLISH_STATUS_MAPPINGS: StatusMapping[] = [
  // Delivered (check first as it's most specific)
  { pattern: /order\s+delivered/i, status: 'delivered' },
  { pattern: /package\s+has\s+been\s+delivered/i, status: 'delivered' },
  { pattern: /delivery\s+completed/i, status: 'delivered' },
  { pattern: /successfully\s+delivered/i, status: 'delivered' },
  { pattern: /status:\s*delivered/i, status: 'delivered' },
  { pattern: /\bwas\s+delivered\b/i, status: 'delivered' },
  
  // Cancelled
  { pattern: /order\s+cancell?ed/i, status: 'cancelled' },
  { pattern: /cancellation\s+confirmed/i, status: 'cancelled' },
  { pattern: /order\s+has\s+been\s+cancell?ed/i, status: 'cancelled' },
  
  // Shipped (check before pending as "shipped" is more specific than "order")
  { pattern: /status:\s*shipped/i, status: 'shipped' },
  { pattern: /\bshipped\b/i, status: 'shipped' },
  { pattern: /order\s+(shipped|dispatched|sent)/i, status: 'shipped' },
  { pattern: /package\s+has\s+been\s+shipped/i, status: 'shipped' },
  { pattern: /on\s+its\s+way/i, status: 'shipped' },
  { pattern: /package\s+is\s+on\s+the\s+way/i, status: 'shipped' },
  { pattern: /tracking\s+(number|code)/i, status: 'shipped' },
  { pattern: /shipment\s+notification/i, status: 'shipped' },
  { pattern: /your\s+package\s+has\s+been\s+shipped/i, status: 'shipped' },
  
  // Confirmed/Order placed -> pending
  { pattern: /order\s+(placed|confirmed|received)/i, status: 'pending' },
  { pattern: /thank\s+you\s+for\s+your\s+(order|purchase)/i, status: 'pending' },
  { pattern: /we\s+have\s+received\s+your\s+order/i, status: 'pending' },
  { pattern: /order\s+confirmation/i, status: 'pending' },
  { pattern: /purchase\s+confirmation/i, status: 'pending' }
]

// Status mappings for Dutch
const DUTCH_STATUS_MAPPINGS: StatusMapping[] = [
  // Delivered (check first as it's most specific)
  { pattern: /bestelling\s+is\s+bezorgd/i, status: 'delivered' },
  { pattern: /pakket\s+is\s+(bezorgd|afgeleverd)/i, status: 'delivered' },
  { pattern: /bezorging\s+voltooid/i, status: 'delivered' },
  { pattern: /succesvol\s+(bezorgd|afgeleverd)/i, status: 'delivered' },
  { pattern: /status:\s*bezorgd/i, status: 'delivered' },
  { pattern: /\bwerd\s+bezorgd\b/i, status: 'delivered' },
  
  // Cancelled
  { pattern: /bestelling\s+geannuleerd/i, status: 'cancelled' },
  { pattern: /annulering\s+bevestigd/i, status: 'cancelled' },
  { pattern: /(je|uw)\s+bestelling\s+is\s+geannuleerd/i, status: 'cancelled' },
  
  // Shipped (check before pending)
  { pattern: /status:\s*verzonden/i, status: 'shipped' },
  { pattern: /\bverzonden\b/i, status: 'shipped' },
  { pattern: /bestelling\s+(verzonden|verstuurd|onderweg)/i, status: 'shipped' },
  { pattern: /pakket\s+is\s+verzonden/i, status: 'shipped' },
  { pattern: /onderweg/i, status: 'shipped' },
  { pattern: /pakket\s+is\s+onderweg/i, status: 'shipped' },
  { pattern: /track\s*&\s*trace/i, status: 'shipped' },
  { pattern: /verzendbevestiging/i, status: 'shipped' },
  { pattern: /(je|uw)\s+pakket\s+is\s+verzonden/i, status: 'shipped' },
  { pattern: /komt\s+eraan/i, status: 'shipped' },
  
  // Confirmed/Order placed -> pending
  { pattern: /bestelling\s+(geplaatst|bevestigd|ontvangen)/i, status: 'pending' },
  { pattern: /bedankt\s+voor\s+(je|uw)\s+bestelling/i, status: 'pending' },
  { pattern: /we\s+hebben\s+(je|uw)\s+bestelling\s+ontvangen/i, status: 'pending' },
  { pattern: /orderbevestiging/i, status: 'pending' },
  { pattern: /bestelbevestiging/i, status: 'pending' },
  { pattern: /aankoopbevestiging/i, status: 'pending' }
]

/**
 * Detect order status from email content
 * @param emailText - The email content to analyze
 * @param language - Language code ('en' or 'nl')
 * @returns The detected status or 'pending' if not detected
 */
export function detectOrderStatus(
  emailText: string, 
  language: 'en' | 'nl' = 'en'
): OrderStatus {
  const mappings = language === 'nl' ? DUTCH_STATUS_MAPPINGS : ENGLISH_STATUS_MAPPINGS
  
  // Check each pattern
  for (const mapping of mappings) {
    if (mapping.pattern.test(emailText)) {
      return mapping.status
    }
  }
  
  // Default to pending if no pattern matches
  return 'pending'
}

/**
 * Get localized status display text
 * @param status - The standardized status
 * @param language - Language code ('en' or 'nl')
 * @returns Localized status text
 */
export function getStatusDisplayText(
  status: OrderStatus,
  language: 'en' | 'nl' = 'en'
): string {
  const translations: Record<string, Record<OrderStatus, string>> = {
    en: {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    },
    nl: {
      pending: 'In Behandeling',
      processing: 'Verwerking',
      shipped: 'Verzonden',
      delivered: 'Bezorgd',
      cancelled: 'Geannuleerd'
    }
  }
  
  return translations[language][status] || status
}

/**
 * Normalize status value from Gemini response
 * Handles variations in status values that Gemini might return
 */
export function normalizeOrderStatus(status: string): OrderStatus {
  const normalized = status.toLowerCase().trim()
  
  // Direct matches
  if (['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(normalized)) {
    return normalized as OrderStatus
  }
  
  // Common variations
  const variations: Record<string, OrderStatus> = {
    // English variations
    'confirmed': 'pending',
    'order confirmed': 'pending',
    'order placed': 'pending',
    'in transit': 'shipped',
    'on the way': 'shipped',
    'dispatched': 'shipped',
    'completed': 'delivered',
    'canceled': 'cancelled',
    
    // Dutch variations
    'bevestigd': 'pending',
    'verzonden': 'shipped',
    'onderweg': 'shipped',
    'bezorgd': 'delivered',
    'afgeleverd': 'delivered',
    'geannuleerd': 'cancelled'
  }
  
  return variations[normalized] || 'pending'
}