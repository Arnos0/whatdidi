#!/usr/bin/env npx tsx

import { AIEmailClassifier } from '../lib/email/ai-parser'
import type { GmailMessage } from '../lib/types/email'

// Mock Gmail messages for testing
const mockEmails: Array<{ name: string; email: Partial<GmailMessage>; expectOrder: boolean }> = [
  {
    name: 'Dutch Bol.com Order',
    email: {
      id: 'test1',
      payload: {
        headers: [
          { name: 'Subject', value: 'Je bestelling is verzonden!' },
          { name: 'From', value: 'Bol.com <noreply@bol.com>' }
        ],
        body: { data: Buffer.from('Beste klant, uw bestelling met bestelnummer 123456 is verzonden.').toString('base64') }
      }
    },
    expectOrder: true
  },
  {
    name: 'German Amazon Order',
    email: {
      id: 'test2',
      payload: {
        headers: [
          { name: 'Subject', value: 'Ihre Bestellung wurde versandt' },
          { name: 'From', value: 'Amazon.de <auto-confirm@amazon.de>' }
        ],
        body: { data: Buffer.from('Ihre Bestellung mit der Bestellnummer 789012 wurde versandt.').toString('base64') }
      }
    },
    expectOrder: true
  },
  {
    name: 'French Newsletter (should reject)',
    email: {
      id: 'test3',
      payload: {
        headers: [
          { name: 'Subject', value: 'Newsletter - Nouvelles offres' },
          { name: 'From', value: 'Marketing <newsletter@example.fr>' }
        ],
        body: { data: Buffer.from('Abonnez-vous à notre newsletter pour recevoir nos offres.').toString('base64') }
      }
    },
    expectOrder: false
  },
  {
    name: 'German Marketing (should reject)',
    email: {
      id: 'test4',
      payload: {
        headers: [
          { name: 'Subject', value: 'Werbung - Sonderangebot' },
          { name: 'From', value: 'Marketing <werbung@example.de>' }
        ],
        body: { data: Buffer.from('Abonnieren Sie unseren Newsletter für exklusive Angebote.').toString('base64') }
      }
    },
    expectOrder: false
  }
]

console.log('🔍 Testing Multilingual Email Classification Integration\n')

let correctClassifications = 0
const totalTests = mockEmails.length

for (const test of mockEmails) {
  console.log(`Testing: ${test.name}`)
  
  try {
    const result = AIEmailClassifier.classify(test.email as GmailMessage)
    
    const isCorrect = result.isPotentialOrder === test.expectOrder
    
    console.log(`  Language: ${result.language}`)
    console.log(`  Is Order: ${result.isPotentialOrder} (expected: ${test.expectOrder})`)
    console.log(`  Confidence: ${result.confidence}`)
    console.log(`  Patterns Found: ${result.debugInfo?.patterns?.join(', ') || 'none'}`)
    console.log(`  Reject Patterns: ${result.debugInfo?.rejectPatterns?.join(', ') || 'none'}`)
    console.log(`  Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`)
    
    if (isCorrect) correctClassifications++
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error}`)
  }
  
  console.log('')
}

console.log(`📊 Classification Results: ${correctClassifications}/${totalTests} correct (${Math.round(correctClassifications/totalTests*100)}%)`)

if (correctClassifications === totalTests) {
  console.log('🎉 All tests passed! Multilingual classification is working correctly.')
} else {
  console.log('⚠️  Some tests failed. Review the patterns or language detection.')
}

console.log('\n🚀 Phase 12 (Multilingual Infrastructure) is complete!')
console.log('Next steps:')
console.log('  1. Apply database migration when Supabase is connected')
console.log('  2. Test with real emails in development')
console.log('  3. Start Phase 13: AI Prompt Enhancement')