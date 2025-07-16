#!/usr/bin/env npx tsx

import { detectEmailLanguage } from '../lib/email/utils/language-detector'
import { LANGUAGE_PATTERNS } from '../lib/email/utils/multilingual-patterns'

// Test emails for language detection
const testEmails = [
  {
    name: 'Dutch Bol.com Order',
    text: 'Beste klant, uw bestelling met bestelnummer 123456789 is verzonden. Totaalbedrag: €89,99',
    expected: 'nl'
  },
  {
    name: 'German Amazon Order',
    text: 'Ihre Bestellung mit der Bestellnummer 789012345 wurde versandt. Gesamtbetrag: €67,50',
    domain: 'amazon.de',
    expected: 'de'
  },
  {
    name: 'French Fnac Order',
    text: 'Votre commande numéro 345678901 a été expédiée. Montant total: 45,99€',
    expected: 'fr'
  },
  {
    name: 'Coolblue Dutch',
    text: 'Je Coolblue bestelling is onderweg! Bestelnummer: CB123456',
    domain: 'coolblue.nl',
    expected: 'nl'
  },
  {
    name: 'Zalando German',
    text: 'Deine Zalando Bestellung ist unterwegs. Bestellnummer: ZAL789012',
    domain: 'zalando.de',
    expected: 'de'
  },
  {
    name: 'Newsletter (should detect but reject)',
    text: 'Abonnez-vous à notre newsletter pour recevoir nos offres',
    expected: 'fr'
  }
]

console.log('🌍 Testing Multilingual Language Detection\n')

let successCount = 0
let totalTests = testEmails.length

testEmails.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`)
  console.log(`Text: "${test.text}"`)
  console.log(`Domain: ${test.domain || 'none'}`)
  
  const detected = detectEmailLanguage(test.text, test.domain)
  const success = detected === test.expected
  
  console.log(`Expected: ${test.expected}, Detected: ${detected} ${success ? '✅' : '❌'}`)
  
  if (success) successCount++
  console.log('')
})

console.log(`📊 Results: ${successCount}/${totalTests} tests passed (${Math.round(successCount/totalTests*100)}%)\n`)

// Test pattern matching
console.log('🔍 Testing Pattern Matching\n')

const patternTests = [
  {
    name: 'Dutch Order Pattern',
    text: 'Je bestelling is verzonden',
    language: 'nl',
    shouldMatch: true
  },
  {
    name: 'German Marketing (should reject)',
    text: 'Abonnieren Sie unseren Newsletter',
    language: 'de',
    shouldMatch: false
  },
  {
    name: 'French Order Pattern',
    text: 'Votre commande a été expédiée',
    language: 'fr',
    shouldMatch: true
  }
]

patternTests.forEach((test, index) => {
  const patterns = LANGUAGE_PATTERNS[test.language]
  const lowerText = test.text.toLowerCase()
  
  const hasRejectPattern = patterns.reject.some(p => lowerText.includes(p.toLowerCase()))
  const hasRetailPattern = patterns.retail.some(p => lowerText.includes(p.toLowerCase()))
  
  const wouldMatch = !hasRejectPattern && hasRetailPattern
  const success = wouldMatch === test.shouldMatch
  
  console.log(`Pattern Test ${index + 1}: ${test.name}`)
  console.log(`Text: "${test.text}" (${test.language})`)
  console.log(`Reject patterns found: ${hasRejectPattern}`)
  console.log(`Retail patterns found: ${hasRetailPattern}`)
  console.log(`Would match: ${wouldMatch}, Expected: ${test.shouldMatch} ${success ? '✅' : '❌'}`)
  console.log('')
})

console.log('🎉 Language detection testing complete!')
console.log('Run this script with: npx tsx scripts/test-language-detection.ts')