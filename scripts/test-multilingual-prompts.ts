#!/usr/bin/env npx tsx

import { buildMultilingualPrompt, buildIncrementalPrompt } from '../lib/ai/prompt-builder'
import { testNumberParser } from '../lib/ai/number-parser'

// Test emails in different languages
const testEmails = [
  {
    name: 'Dutch Bol.com Order',
    language: 'nl',
    emailText: `
From: Bol.com <noreply@bol.com>
Subject: Je bestelling is verzonden!
Date: 2025-01-16T10:30:00Z

Beste klant,

Uw bestelling met bestelnummer 123456789 is verzonden.
Totaalbedrag: €89,99
Verwachte bezorging: 18 januari 2025

Bedankt voor uw aankoop!
`
  },
  {
    name: 'German Amazon Order',
    language: 'de',
    emailText: `
From: Amazon.de <auto-confirm@amazon.de>
Subject: Ihre Bestellung wurde versandt
Date: 2025-01-16T10:30:00Z

Sehr geehrte Damen und Herren,

Ihre Bestellung mit der Bestellnummer 789012345 wurde versandt.
Gesamtbetrag: €67,50
Liefertermin: 18. Januar 2025

Vielen Dank für Ihre Bestellung!
`
  },
  {
    name: 'French Fnac Order',
    language: 'fr',
    emailText: `
From: Fnac <commande@fnac.fr>
Subject: Votre commande a été expédiée
Date: 2025-01-16T10:30:00Z

Bonjour,

Votre commande numéro 345678901 a été expédiée.
Montant total: 45,99€
Date de livraison: 18 janvier 2025

Merci pour votre commande!
`
  },
  {
    name: 'English Amazon Order',
    language: 'en',
    emailText: `
From: Amazon.com <auto-confirm@amazon.com>
Subject: Your order has been shipped
Date: 2025-01-16T10:30:00Z

Dear Customer,

Your order with order number 456789012 has been shipped.
Total amount: $59.99
Estimated delivery: January 18, 2025

Thank you for your order!
`
  }
]

console.log('🌍 Testing Multilingual AI Prompts\n')

console.log('='.repeat(60))
console.log('1. Testing Number Parser')
console.log('='.repeat(60))
testNumberParser()

console.log('\n' + '='.repeat(60))
console.log('2. Testing Multilingual Prompts')
console.log('='.repeat(60))

testEmails.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name} (${test.language.toUpperCase()})`)
  console.log('-'.repeat(40))
  
  const prompt = buildMultilingualPrompt({
    language: test.language,
    emailText: test.emailText,
    maxLength: 5000,
    includeExamples: true
  })
  
  console.log('Generated Prompt:')
  console.log(prompt.substring(0, 500) + '...')
  console.log('')
})

console.log('\n' + '='.repeat(60))
console.log('3. Testing Incremental Prompting')
console.log('='.repeat(60))

const incrementalTest = {
  language: 'nl',
  emailText: testEmails[0].emailText,
  missingFields: ['trackingNumber', 'carrier'],
  context: 'Previous analysis found order number and amount, but missing tracking info'
}

const incrementalPrompt = buildIncrementalPrompt(incrementalTest)
console.log('Incremental Prompt Example:')
console.log(incrementalPrompt)

console.log('\n' + '='.repeat(60))
console.log('4. Prompt Length Analysis')
console.log('='.repeat(60))

testEmails.forEach((test) => {
  const prompt = buildMultilingualPrompt({
    language: test.language,
    emailText: test.emailText,
    maxLength: 10000,
    includeExamples: true
  })
  
  console.log(`${test.language.toUpperCase()}: ${prompt.length} characters`)
})

console.log('\n' + '='.repeat(60))
console.log('5. Language-Specific Term Testing')
console.log('='.repeat(60))

import { getLanguageTerms } from '../lib/ai/language-terms'

const languages = ['nl', 'de', 'fr', 'en']
languages.forEach(lang => {
  const terms = getLanguageTerms(lang)
  console.log(`\n${lang.toUpperCase()} Terms:`)
  console.log(`  Order: ${terms.orderTerms.slice(0, 3).join(', ')}`)
  console.log(`  Total: ${terms.totalTerms.slice(0, 3).join(', ')}`)
  console.log(`  Delivery: ${terms.deliveryTerms.slice(0, 3).join(', ')}`)
  console.log(`  Currency: ${terms.currencySymbols.join(', ')}`)
})

console.log('\n🎉 Multilingual prompt testing complete!')
console.log('\nNext steps:')
console.log('1. Test with real Gemini API (if available)')
console.log('2. Collect real emails in each language for testing')
console.log('3. Compare accuracy vs. old hardcoded prompts')
console.log('4. Deploy to Phase 11.3: Hybrid Parsing Layer')

console.log('\nRun this script with: npx tsx scripts/test-multilingual-prompts.ts')