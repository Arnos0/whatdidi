import { getLanguageTerms, buildLanguageExamples } from './language-terms'

/**
 * Dynamic prompt builder for multilingual email analysis
 * Generates language-specific prompts for better AI extraction
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
  
  const prompt = `Analyze this email. If it's an order (purchase confirmation/shipping/delivery), extract:

${fieldDescriptions}

${instructions}

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
    
    de: `- orderNumber (suche nach: ${terms.orderTerms.join(', ')})
- retailer (aus Absender-Domain oder Firmenname)
- amount & currency (suche nach: ${terms.totalTerms.join(', ')}, ${terms.currencySymbols.join(', ')})
- orderDate (ISO-Format)
- status (confirmed/shipped/delivered)
- estimatedDelivery (suche nach: ${terms.deliveryTerms.join(', ')})
- trackingNumber & carrier (falls vorhanden)
- items Array mit name, quantity, price (falls detailliert)
- confidence (0-1)`,
    
    fr: `- orderNumber (cherchez: ${terms.orderTerms.join(', ')})
- retailer (du domaine expéditeur ou nom de l'entreprise)
- amount & currency (cherchez: ${terms.totalTerms.join(', ')}, ${terms.currencySymbols.join(', ')})
- orderDate (format ISO)
- status (confirmed/shipped/delivered)
- estimatedDelivery (cherchez: ${terms.deliveryTerms.join(', ')})
- trackingNumber & carrier (si présent)
- items array avec name, quantity, price (si détaillé)
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
- Voor Coolblue: zoek naar prijs na "€" symbool
- Nederlands nummerformaat: 89,99 → 89.99
- Als je geen exacte bestelgegevens kunt vinden, zoek harder in de emailtekst`,
    
    de: `WICHTIG für deutsche E-Mails:
- Suche nach ${terms.orderTerms.join(' oder ')} für Bestellnummer (kann auch im Betreff nach Doppelpunkt stehen)
- ${terms.totalTerms.join(' oder ')} = Gesamtbetrag
- ${terms.deliveryTerms.join(' oder ')} = Lieferung
- Währung ist meist EUR (€)
- Deutsches Zahlenformat: 89,99 → 89.99
- Wenn Sie keine genauen Bestelldetails finden können, suchen Sie intensiver im E-Mail-Text`,
    
    fr: `IMPORTANT pour les emails français:
- Cherchez ${terms.orderTerms.join(' ou ')} pour le numéro de commande (peut aussi être dans le sujet après deux-points)
- ${terms.totalTerms.join(' ou ')} = montant total
- ${terms.deliveryTerms.join(' ou ')} = livraison
- La devise est généralement EUR (€)
- Format de nombre français: 89,99 → 89.99
- Si vous ne trouvez pas les détails exacts de la commande, cherchez plus attentivement dans le texte de l'email`,
    
    en: `IMPORTANT for English emails:
- Look for ${terms.orderTerms.join(' or ')} for order number (may also be in subject after colon)
- ${terms.totalTerms.join(' or ')} = total amount
- ${terms.deliveryTerms.join(' or ')} = delivery
- Currency is usually EUR (€) or USD ($)
- If you can't find exact order details, look harder in the email body`
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
    nl: `Zoek specifiek naar deze ontbrekende velden in deze ${language.toUpperCase()} email:`,
    de: `Suchen Sie spezifisch nach diesen fehlenden Feldern in dieser ${language.toUpperCase()} E-Mail:`,
    fr: `Cherchez spécifiquement ces champs manquants dans cet email ${language.toUpperCase()}:`,
    en: `Look specifically for these missing fields in this ${language.toUpperCase()} email:`
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