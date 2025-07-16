/**
 * Basic multilingual parser test without server dependencies
 * Tests the core parsing logic and number/date handling
 */

import { parseEuropeanNumber, parseEuropeanDate } from '../lib/ai/number-parser'
import { detectEmailLanguage } from '../lib/email/utils/language-detector'

/**
 * Test European number parsing
 */
function testNumberParsing() {
  console.log('\n=== Testing European Number Parsing ===')
  
  const testCases = [
    { value: '89,99', language: 'nl', expected: 89.99 },
    { value: '€1.234,56', language: 'de', expected: 1234.56 },
    { value: '1 234,56€', language: 'fr', expected: 1234.56 },
    { value: '€1,234.56', language: 'en', expected: 1234.56 },
    { value: '156,78', language: 'de', expected: 156.78 },
    { value: '245,67€', language: 'fr', expected: 245.67 },
    { value: '€12.345,00', language: 'nl', expected: 12345.00 },
    { value: '2 500,99 €', language: 'fr', expected: 2500.99 }
  ]
  
  let passed = 0
  let failed = 0
  
  testCases.forEach(test => {
    const result = parseEuropeanNumber(test.value, test.language)
    const success = Math.abs(result - test.expected) < 0.01
    console.log(`${test.value.padEnd(15)} (${test.language}) → ${result.toString().padEnd(10)} ${success ? '✅' : '❌'} (expected ${test.expected})`)
    
    if (success) {
      passed++
    } else {
      failed++
    }
  })
  
  console.log(`\nNumber Parsing Results: ${passed} passed, ${failed} failed`)
  return { passed, failed }
}

/**
 * Test European date parsing
 */
function testDateParsing() {
  console.log('\n=== Testing European Date Parsing ===')
  
  const testCases = [
    { value: '15/01/2025', language: 'nl', expected: '2025-01-15' },
    { value: '18.01.2025', language: 'de', expected: '2025-01-18' },
    { value: '20/01/2025', language: 'fr', expected: '2025-01-20' },
    { value: '2025-01-22', language: 'en', expected: '2025-01-22' },
    { value: '31.12.2024', language: 'de', expected: '2024-12-31' },
    { value: '01/02/2025', language: 'fr', expected: '2025-02-01' }
  ]
  
  let passed = 0
  let failed = 0
  
  testCases.forEach(test => {
    const result = parseEuropeanDate(test.value, test.language)
    const success = result === test.expected
    console.log(`${test.value.padEnd(15)} (${test.language}) → ${(result || 'null').padEnd(12)} ${success ? '✅' : '❌'} (expected ${test.expected})`)
    
    if (success) {
      passed++
    } else {
      failed++
    }
  })
  
  console.log(`\nDate Parsing Results: ${passed} passed, ${failed} failed`)
  return { passed, failed }
}

/**
 * Test language detection
 */
function testLanguageDetection() {
  console.log('\n=== Testing Language Detection ===')
  
  const testCases = [
    {
      text: 'Hallo, je bestelling is verzonden en komt naar je toe! Bestelnummer: 12345678',
      expected: 'nl',
      description: 'Dutch Coolblue email'
    },
    {
      text: 'Ihre Bestellung wurde versandt. Bestellnummer: 123-4567890-1234567',
      expected: 'de', 
      description: 'German Amazon email'
    },
    {
      text: 'Votre commande a été expédiée ! Numéro de commande: 12345678-1234',
      expected: 'fr',
      description: 'French Zalando email'
    },
    {
      text: 'Your order has been shipped. Order number: 12345678',
      expected: 'en',
      description: 'English Amazon email'
    },
    {
      text: 'Bedankt voor je bestelling bij Coolblue. Totaalbedrag: €89,99',
      expected: 'nl',
      description: 'Dutch order confirmation'
    },
    {
      text: 'Danke für Ihre Bestellung. Gesamtbetrag: €156,78',
      expected: 'de',
      description: 'German order confirmation'
    }
  ]
  
  let passed = 0
  let failed = 0
  
  testCases.forEach(test => {
    const result = detectEmailLanguage(test.text)
    const success = result === test.expected
    console.log(`${test.description.padEnd(30)} → ${result.padEnd(4)} ${success ? '✅' : '❌'} (expected ${test.expected})`)
    
    if (success) {
      passed++
    } else {
      failed++
    }
  })
  
  console.log(`\nLanguage Detection Results: ${passed} passed, ${failed} failed`)
  return { passed, failed }
}

/**
 * Test multilingual patterns
 */
function testMultilingualPatterns() {
  console.log('\n=== Testing Multilingual Patterns ===')
  
  const testCases = [
    {
      text: 'Bestelnummer: 12345678',
      language: 'nl',
      pattern: /bestelnummer[:\\s]+([A-Z0-9]+)/i,
      expected: '12345678',
      description: 'Dutch order number'
    },
    {
      text: 'Bestellnummer: 123-4567890-1234567',
      language: 'de',
      pattern: /bestellnummer[:\\s]+([A-Z0-9\\-]+)/i,
      expected: '123-4567890-1234567',
      description: 'German order number'
    },
    {
      text: 'Numéro de commande: 12345678-1234',
      language: 'fr',
      pattern: /numéro de commande[:\\s]+([A-Z0-9\\-]+)/i,
      expected: '12345678-1234',
      description: 'French order number'
    },
    {
      text: 'Totaalbedrag: €89,99',
      language: 'nl',
      pattern: /totaalbedrag[:\\s]*€?\\s*([\\d.,]+)/i,
      expected: '89,99',
      description: 'Dutch amount'
    },
    {
      text: 'Gesamtbetrag: €156,78',
      language: 'de',
      pattern: /gesamtbetrag[:\\s]*€?\\s*([\\d.,]+)/i,
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
    }
  })
  
  console.log(`\nPattern Matching Results: ${passed} passed, ${failed} failed`)
  return { passed, failed }
}

/**
 * Test retailer domain detection
 */
function testRetailerDetection() {
  console.log('\n=== Testing Retailer Domain Detection ===')
  
  const testCases = [
    { domain: 'no-reply@coolblue.nl', expected: 'coolblue', description: 'Coolblue Netherlands' },
    { domain: 'auto-confirm@amazon.de', expected: 'amazon', description: 'Amazon Germany' },
    { domain: 'noreply@zalando.fr', expected: 'zalando', description: 'Zalando France' },
    { domain: 'orders@bol.com', expected: 'bol', description: 'Bol.com' },
    { domain: 'info@otto.de', expected: 'otto', description: 'Otto Germany' },
    { domain: 'contact@fnac.fr', expected: 'fnac', description: 'Fnac France' },
    { domain: 'newsletter@unknown.com', expected: null, description: 'Unknown retailer' }
  ]
  
  const retailers = [
    { domains: ['coolblue.nl', 'coolblue.be'], name: 'coolblue' },
    { domains: ['amazon.nl', 'amazon.de', 'amazon.fr', 'amazon.com'], name: 'amazon' },
    { domains: ['zalando.nl', 'zalando.de', 'zalando.fr', 'zalando.com'], name: 'zalando' },
    { domains: ['bol.com', 'partnerbol.com'], name: 'bol' },
    { domains: ['otto.de'], name: 'otto' },
    { domains: ['fnac.fr', 'fnac.com'], name: 'fnac' }
  ]
  
  function identifyRetailer(from: string): string | null {
    const fromLower = from.toLowerCase()
    
    for (const retailer of retailers) {
      if (retailer.domains.some(domain => fromLower.includes(domain))) {
        return retailer.name
      }
    }
    
    return null
  }
  
  let passed = 0
  let failed = 0
  
  testCases.forEach(test => {
    const result = identifyRetailer(test.domain)
    const success = result === test.expected
    console.log(`${test.description.padEnd(25)} → ${(result || 'null').padEnd(12)} ${success ? '✅' : '❌'} (expected ${test.expected || 'null'})`)
    
    if (success) {
      passed++
    } else {
      failed++
    }
  })
  
  console.log(`\nRetailer Detection Results: ${passed} passed, ${failed} failed`)
  return { passed, failed }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Basic Multilingual Tests\n')
  
  const results = {
    numberParsing: testNumberParsing(),
    dateParsing: testDateParsing(),
    languageDetection: testLanguageDetection(),
    patternMatching: testMultilingualPatterns(),
    retailerDetection: testRetailerDetection()
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 FINAL TEST RESULTS')
  console.log('='.repeat(50))
  
  let totalPassed = 0
  let totalFailed = 0
  
  Object.entries(results).forEach(([testName, result]) => {
    const percentage = Math.round((result.passed / (result.passed + result.failed)) * 100)
    console.log(`${testName.padEnd(20)}: ${result.passed} passed, ${result.failed} failed (${percentage}%)`)
    totalPassed += result.passed
    totalFailed += result.failed
  })
  
  const overallPercentage = Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
  console.log('\n' + '='.repeat(50))
  console.log(`🎯 OVERALL RESULTS: ${totalPassed} passed, ${totalFailed} failed (${overallPercentage}%)`)
  
  if (overallPercentage >= 90) {
    console.log('🎉 EXCELLENT! Multilingual infrastructure is working great!')
  } else if (overallPercentage >= 75) {
    console.log('✅ GOOD! Most functionality is working correctly.')
  } else {
    console.log('⚠️  Some issues detected. Review failed tests above.')
  }
  
  console.log('\n✨ Next steps:')
  console.log('1. Start dev server: ./start-dev.sh')
  console.log('2. Access app at: http://localhost:3002')
  console.log('3. Test email parsing in the dashboard')
  console.log('4. Try the debug endpoints for live testing')
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests()
}

export { runAllTests }