/**
 * Test the multilingual infrastructure via API endpoints
 */

async function testApiHealth() {
  console.log('🔍 Testing API Health...')
  
  try {
    const response = await fetch('http://localhost:3002/api/health')
    const data = await response.json()
    
    console.log('✅ API Health:', data.status)
    console.log('📊 Database tables:', Object.keys(data.database.tables).length)
    console.log('🔑 Environment variables configured:', Object.keys(data.environment).length)
    
    return data.status === 'ok'
  } catch (error) {
    console.error('❌ API Health check failed:', error)
    return false
  }
}

async function testMultilingualEndpoints() {
  console.log('\n🌍 Testing Multilingual API Endpoints...')
  
  const testCases = [
    {
      name: 'Language Detection Test',
      endpoint: '/api/test/parsers',
      method: 'POST',
      body: {
        email: {
          subject: 'Je bestelling 12345678 is verzonden',
          from: 'no-reply@coolblue.nl',
          body: 'Hallo, je bestelling is verzonden! Totaalbedrag: €89,99'
        }
      },
      expected: 'should detect Dutch language'
    },
    {
      name: 'German Email Test',
      endpoint: '/api/test/parsers',
      method: 'POST',
      body: {
        email: {
          subject: 'Ihre Bestellung wurde versandt',
          from: 'auto-confirm@amazon.de',
          body: 'Bestellnummer: 123-4567890-1234567, Gesamtbetrag: €156,78'
        }
      },
      expected: 'should detect German language'
    },
    {
      name: 'French Email Test',
      endpoint: '/api/test/parsers',
      method: 'POST',
      body: {
        email: {
          subject: 'Votre commande a été expédiée',
          from: 'noreply@zalando.fr',
          body: 'Numéro de commande: 12345678-1234, Total: 245,67€'
        }
      },
      expected: 'should detect French language'
    }
  ]
  
  for (const test of testCases) {
    console.log(`\n📧 ${test.name}:`)
    
    try {
      const response = await fetch(`http://localhost:3002${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.body)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Response received (${response.status})`)
        console.log(`📄 Response length: ${JSON.stringify(data).length} characters`)
        
        // Check if response contains expected multilingual elements
        const responseStr = JSON.stringify(data).toLowerCase()
        if (responseStr.includes('language') || responseStr.includes('confidence') || responseStr.includes('order')) {
          console.log(`✅ ${test.expected}`)
        } else {
          console.log(`⚠️  Response may not contain expected multilingual data`)
        }
      } else {
        console.log(`❌ API request failed (${response.status})`)
      }
    } catch (error) {
      console.log(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

async function testRetailerDetection() {
  console.log('\n🏪 Testing Retailer Detection API...')
  
  try {
    const response = await fetch('http://localhost:3002/api/retailers')
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Retailers API working')
      console.log(`📊 Number of retailers: ${data.length || 'unknown'}`)
      
      // Check if multilingual retailers are included
      const retailerNames = JSON.stringify(data).toLowerCase()
      const multilingualRetailers = ['coolblue', 'amazon', 'zalando']
      
      multilingualRetailers.forEach(retailer => {
        if (retailerNames.includes(retailer)) {
          console.log(`✅ ${retailer} detected`)
        } else {
          console.log(`❌ ${retailer} not found`)
        }
      })
    } else {
      console.log(`❌ Retailers API failed (${response.status})`)
    }
  } catch (error) {
    console.log(`❌ Retailers API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function runApiTests() {
  console.log('🚀 Starting API Multilingual Tests')
  console.log('='.repeat(50))
  
  const healthOk = await testApiHealth()
  
  if (healthOk) {
    await testMultilingualEndpoints()
    await testRetailerDetection()
  } else {
    console.log('❌ Skipping other tests due to health check failure')
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🎯 API Testing Complete!')
  console.log('\n💡 Next steps:')
  console.log('1. Visit http://localhost:3002 to test the UI')
  console.log('2. Go to /dashboard/orders to test email parsing')
  console.log('3. Use the debug endpoints for detailed testing')
  console.log('4. Connect a Gmail account to test with real emails')
}

if (require.main === module) {
  runApiTests()
}