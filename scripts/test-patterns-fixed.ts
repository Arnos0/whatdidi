/**
 * Test multilingual patterns with corrected regex
 */

/**
 * Test multilingual patterns with proper escaping
 */
function testMultilingualPatterns() {
  console.log('\n=== Testing Multilingual Patterns (Fixed) ===')
  
  const testCases = [
    {
      text: 'Bestelnummer: 12345678',
      language: 'nl',
      pattern: /bestelnummer[:\s]+([A-Z0-9]+)/i,
      expected: '12345678',
      description: 'Dutch order number'
    },
    {
      text: 'Bestellnummer: 123-4567890-1234567',
      language: 'de',
      pattern: /bestellnummer[:\s]+([A-Z0-9\-]+)/i,
      expected: '123-4567890-1234567',
      description: 'German order number'
    },
    {
      text: 'Numéro de commande: 12345678-1234',
      language: 'fr',
      pattern: /numéro de commande[:\s]+([A-Z0-9\-]+)/i,
      expected: '12345678-1234',
      description: 'French order number'
    },
    {
      text: 'Totaalbedrag: €89,99',
      language: 'nl',
      pattern: /totaalbedrag[:\s]*€?\s*([\d.,]+)/i,
      expected: '89,99',
      description: 'Dutch amount'
    },
    {
      text: 'Gesamtbetrag: €156,78',
      language: 'de',
      pattern: /gesamtbetrag[:\s]*€?\s*([\d.,]+)/i,
      expected: '156,78',
      description: 'German amount'
    }
  ]
  
  let passed = 0
  let failed = 0
  
  testCases.forEach(test => {
    const match = test.text.match(test.pattern)
    const result = match ? match[1] : null
    const success = result === test.expected
    console.log(`${test.description.padEnd(25)} → ${(result || 'null').padEnd(20)} ${success ? '✅' : '❌'} (expected ${test.expected})`)
    
    if (success) {
      passed++
    } else {
      failed++
      console.log(`  Pattern: ${test.pattern.source}`)
      console.log(`  Text: "${test.text}"`)
    }
  })
  
  console.log(`\nPattern Matching Results: ${passed} passed, ${failed} failed`)
  return { passed, failed }
}

if (require.main === module) {
  testMultilingualPatterns()
}