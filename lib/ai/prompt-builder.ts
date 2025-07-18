import { getLanguageTerms, buildLanguageExamples } from './language-terms'

/**
 * Dynamic prompt builder for multilingual email analysis
 * MVP: Simplified for English and Dutch only
 */

export interface PromptOptions {
  language: string
  emailText: string
  maxLength?: number
  includeExamples?: boolean
}

export function buildMultilingualPrompt(options: PromptOptions): string {
  const { language, emailText, maxLength = 10000, includeExamples = true } = options
  const terms = getLanguageTerms(language)
  
  // Build language-specific field descriptions
  const fieldDescriptions = buildFieldDescriptions(language, terms)
  
  // Build language-specific instructions
  const instructions = buildLanguageInstructions(language, terms)
  
  // Build examples if requested
  const examples = includeExamples ? buildLanguageExamples(language) : ''
  
  // Truncate email text if too long
  const truncatedEmail = emailText.substring(0, maxLength)
  const truncationNote = emailText.length > maxLength ? '... [truncated]' : ''
  
  const prompt = `Analyze this email and determine if it's related to a purchase/order/delivery.

IMPORTANT: The following emails ARE valid orders:
- Purchase confirmations from retailers
- Shipping notifications from carriers (DHL, PostNL, UPS, etc.)
- Tracking updates and delivery notifications
- Order status updates
- Ticket purchases (concerts, sports, transport)
- Digital purchases and subscriptions
- Hotel/travel booking confirmations

IMPORTANT: The following emails are NOT orders (return isOrder=false):
- Promotional emails advertising sales, discounts, or savings
- Marketing campaigns with offers, deals, or "limited time" promotions
- Newsletters (even if from retailers)
- Hotel/travel promotional offers without booking details
- Emails with subject lines containing: "sale", "savings", "discount", "offer", "deal"
- Any email focused on getting you to make a purchase rather than confirming one
- Sent emails or copies of emails you sent (check if sender email matches recipient domain)
- Forwarded emails from your own company/domain
- Email copies in "Sent Items" folder

Extract the following information:
${fieldDescriptions}

${instructions}

SPECIAL INSTRUCTIONS:
1. For shipping/tracking emails (DHL, PostNL, etc.):
   - The "retailer" should be the original merchant, NOT the carrier
   - Look for retailer info in: sender name, email body, package description
   - Common patterns to find retailer:
     * Dutch: "Pakket van [RETAILER]", "bestelling bij [RETAILER]", "Afzender: [RETAILER]"
     * English: "Package from [RETAILER]", "Your [RETAILER] order", "Sender: [RETAILER]"
   - Check email body for mentions of known retailers: Coolblue, Bol.com, Amazon, Zalando, etc.
   - Look for "Je Coolblue bestelling", "Uw bestelling bij", "Your order from"
   - If retailer cannot be determined, set retailer as "Unknown (via [CARRIER])"
   - NEVER use just the carrier name as retailer
   - Extract tracking number and carrier name

2. For emails without clear order numbers:
   - Check subject line for numbers in parentheses
   - Look for reference numbers, booking codes, confirmation codes
   - Any long number sequence could be an order number

3. For amount extraction:
   - Handle Dutch number format: "89,99" → 89.99, "1.234,56" → 1234.56
   - If no total amount, look for item prices
   - For tickets/events, any price mentioned is the amount
   - For tracking-only emails, amount can be null but still mark as order

${examples}

Return ONLY valid JSON:
{"isOrder": true/false, "orderData": {...}, "debugInfo": {"language": "${language}", "emailType": "..."}}

Email:
${truncatedEmail}${truncationNote}`

  return prompt
}

function buildFieldDescriptions(language: string, terms: any): string {
  const descriptions: Record<string, string> = {
    nl: `- orderNumber (zoek naar: ${terms.orderTerms.join(', ')})
- retailer (van afzender domein of bedrijfsnaam)
- amount & currency (zoek naar: ${terms.totalTerms.join(', ')}, ${terms.currencySymbols.join(', ')})
- orderDate (ISO format)
- status (confirmed/shipped/delivered)
- estimatedDelivery (zoek naar: ${terms.deliveryTerms.join(', ')})
- trackingNumber & carrier (indien aanwezig)
- items array met name, quantity, price (indien gedetailleerd)
- confidence (0-1)`,
    
    en: `- orderNumber (look for: ${terms.orderTerms.join(', ')})
- retailer (from sender email domain or company name)
- amount & currency (look for: ${terms.totalTerms.join(', ')}, ${terms.currencySymbols.join(', ')})
- orderDate (ISO format)
- status (confirmed/shipped/delivered)
- estimatedDelivery (look for: ${terms.deliveryTerms.join(', ')})
- trackingNumber & carrier (if present)
- items array with name, quantity, price (if detailed)
- confidence (0-1)`
  }
  
  return descriptions[language] || descriptions['en']
}

function buildLanguageInstructions(language: string, terms: any): string {
  const instructions: Record<string, string> = {
    nl: `BELANGRIJK voor Nederlandse emails:
- Zoek naar ${terms.orderTerms.join(' of ')} voor bestelnummer (kan ook in onderwerp na dubbele punt staan)
- ${terms.totalTerms.join(' of ')} = totaalbedrag
- ${terms.deliveryTerms.join(' of ')} = bezorging
- Valuta is meestal EUR (€)
- Voor Coolblue: zoek naar prijs na "€" symbool EN bestelnummer in onderwerp tussen haakjes
- Voor DHL/PostNL: dit zijn GELDIGE bestellingen, zoek naar afzender/retailer info in email
- Nederlands nummerformaat: 89,99 → 89.99 of 1.234,56 → 1234.56
- Track & Trace codes zijn ook geldige ordernummers
- Als geen bedrag gevonden voor verzending-only emails: amount mag null zijn
- ALTIJD isOrder=true voor bezorg/tracking emails`,
    
    en: `IMPORTANT for English emails:
- Look for ${terms.orderTerms.join(' or ')} for order number (may also be in subject after colon)
- ${terms.totalTerms.join(' or ')} = total amount
- ${terms.deliveryTerms.join(' or ')} = delivery
- Currency is usually EUR (€) but could be other
- For DHL/UPS/FedEx: These ARE valid orders, look for merchant info in email
- Tracking numbers are valid order numbers
- If no amount found for shipping-only emails: amount can be null
- ALWAYS isOrder=true for delivery/tracking emails`
  }
  
  return instructions[language] || instructions['en']
}

/**
 * Build a simplified prompt for incremental analysis
 * Used when re-prompting for missing fields
 */
export function buildIncrementalPrompt(options: {
  language: string
  emailText: string
  missingFields: string[]
  context?: string
}): string {
  const { language, emailText, missingFields, context = '' } = options
  const terms = getLanguageTerms(language)
  
  const fieldInstructions = {
    nl: `Zoek specifiek naar deze ontbrekende velden in deze Nederlandse email:`,
    en: `Look specifically for these missing fields in this English email:`
  }
  
  const fieldMappings: Record<string, string> = {
    orderNumber: terms.orderTerms.join(', '),
    amount: terms.totalTerms.join(', '),
    estimatedDelivery: terms.deliveryTerms.join(', ')
  }
  
  const missingFieldsText = missingFields.map(field => 
    `- ${field}: ${fieldMappings[field] || field}`
  ).join('\n')
  
  const fieldInstructionsRecord: Record<string, string> = fieldInstructions
  const prompt = `${fieldInstructionsRecord[language] || fieldInstructionsRecord['en']}

${missingFieldsText}

${context}

Return only the missing fields in JSON format:
{"missingFields": {...}}

Email excerpt:
${emailText.substring(0, 5000)}`

  return prompt
}

/**
 * Build a focused MVP prompt for English and Dutch emails
 * This is optimized for n8n email forwarding workflow
 */
export function buildMVPPrompt(emailText: string, detectedLanguage: string = 'en'): string {
  // Force language to be either 'en' or 'nl'
  const language = (detectedLanguage === 'nl') ? 'nl' : 'en'
  
  // Add specific instructions for MVP processing
  const mvpInstructions = language === 'nl' ? `
EXTRA MVP INSTRUCTIES:
- Nederlands gebruikt komma's voor decimalen: €89,99 = 89.99
- Nederlands gebruikt punten voor duizendtallen: €1.234,56 = 1234.56
- ALTIJD getallen converteren naar Engels formaat in JSON response
- Als confidence < 0.7, wordt needs_review=true gezet
- Voor handmatige invoer via n8n: is_manual=true` : `
EXTRA MVP INSTRUCTIONS:
- English uses dots for decimals: $89.99 = 89.99
- English uses commas for thousands: $1,234.56 = 1234.56
- Always return numbers in standard format (dots for decimals)
- If confidence < 0.7, needs_review will be set to true
- For manual entry via n8n: is_manual=true`

  const basePrompt = buildMultilingualPrompt({
    language,
    emailText,
    maxLength: 10000,
    includeExamples: true
  })
  
  // Insert MVP instructions before the JSON return instruction
  return basePrompt.replace(
    'Return ONLY valid JSON:',
    mvpInstructions + '\n\nReturn ONLY valid JSON:'
  )
}