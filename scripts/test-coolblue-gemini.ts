#!/usr/bin/env npx tsx
import { GoogleGenerativeAI } from '@google/generative-ai'

// Direct Gemini test without server-only imports
const apiKey = process.env.GOOGLE_AI_API_KEY
if (!apiKey) {
  throw new Error('GOOGLE_AI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-lite',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.1
  }
})

// Test email content from a real Coolblue order confirmation
const coolblueTestEmail = {
  subject: "✅ Je bestelling is gelukt, Arno!",
  from: "Coolblue <bestellingen@coolblue.nl>",
  date: new Date('2025-01-12T10:30:00Z'),
  body: `
<!DOCTYPE html>
<html>
<head>
<style>
  .order-details { background: #f5f5f5; padding: 20px; }
  .price { font-weight: bold; color: #000; }
</style>
</head>
<body>
  <div class="header">
    <h1>Bedankt voor je bestelling!</h1>
  </div>
  
  <div class="order-details">
    <h2>Bestelgegevens</h2>
    <p><strong>Bestelnummer:</strong> 30129822</p>
    <p><strong>Besteldatum:</strong> 12 januari 2025</p>
    
    <h3>Jouw producten</h3>
    <table>
      <tr>
        <td>Trust Verto Draadloze Muis</td>
        <td class="price">€ 12,99</td>
      </tr>
      <tr>
        <td>HP 912XL Inktcartridge Zwart</td>
        <td class="price">€ 36,99</td>
      </tr>
    </table>
    
    <div class="totals">
      <p>Subtotaal: € 49,98</p>
      <p>Verzendkosten: € 0,00</p>
      <p><strong>Totaal: € 49,98</strong></p>
    </div>
    
    <div class="delivery">
      <h3>Bezorging</h3>
      <p>Verwachte bezorging: dinsdag 14 januari</p>
      <p>Bezorgadres: Hoofdstraat 123, 1234 AB Amsterdam</p>
    </div>
  </div>
  
  <div class="footer">
    <p>Track je pakket via de Coolblue app of website.</p>
  </div>
</body>
</html>
  `
}

async function analyzeEmail(emailContent: any) {
  const emailText = `
From: ${emailContent.from}
Subject: ${emailContent.subject}
Date: ${emailContent.date.toISOString()}

${emailContent.body}
`
  
  const prompt = `Analyze this email. If it's an order (purchase confirmation/shipping/delivery), extract:
- orderNumber (look for: bestelnummer, ordernummer, order number, order #)
- retailer (from sender email domain or company name)
- amount & currency (look for: totaal, total, bedrag, EUR, €)
- orderDate (ISO format)
- status (confirmed/shipped/delivered)
- estimatedDelivery (look for: bezorging, levering, delivery)
- trackingNumber & carrier (if present)
- items array with name, quantity, price (if detailed)
- confidence (0-1)

IMPORTANT for Dutch emails:
- "bestelnummer" = order number (may also be in subject after colon)
- "totaal" or "totaalbedrag" = total amount
- "bezorging" or "levering" = delivery
- Currency is usually EUR (€)
- For Coolblue: look for price after "€" symbol
- If you can't find exact order details, look harder in the email body

Return ONLY valid JSON:
{"isOrder": true/false, "orderData": {...}, "debugInfo": {"language": "xx", "emailType": "..."}}

Email:
${emailText.substring(0, 8000)}`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()
  return JSON.parse(text)
}

async function testGeminiWithCoolblue() {
  console.log('Testing Gemini with Coolblue email...\n')
  
  try {
    console.log('Email details:')
    console.log(`Subject: ${coolblueTestEmail.subject}`)
    console.log(`From: ${coolblueTestEmail.from}`)
    console.log(`Body length: ${coolblueTestEmail.body.length} chars`)
    console.log('\n---\n')
    
    console.log('Sending to Gemini for analysis...')
    const result = await analyzeEmail(coolblueTestEmail)
    
    console.log('\nGemini Response:')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.isOrder && result.orderData) {
      console.log('\n✅ Order detected!')
      console.log(`Order number: ${result.orderData.orderNumber}`)
      console.log(`Amount: ${result.orderData.amount} ${result.orderData.currency}`)
      console.log(`Retailer: ${result.orderData.retailer}`)
      console.log(`Status: ${result.orderData.status}`)
      console.log(`Confidence: ${result.orderData.confidence}`)
      
      if (result.orderData.items && result.orderData.items.length > 0) {
        console.log('\nItems:')
        result.orderData.items.forEach((item: any) => {
          console.log(`- ${item.name} (${item.quantity}x) - €${item.price}`)
        })
      }
    } else {
      console.log('\n❌ Order NOT detected or missing order data')
      console.log('This is the issue - Gemini is not extracting the order details')
    }
    
    // Test with a simplified version
    console.log('\n\n--- Testing with simplified content ---\n')
    const simplifiedEmail = {
      ...coolblueTestEmail,
      body: `
Bestelnummer: 30129822
Totaal: € 49,98
Bezorging: dinsdag 14 januari

Producten:
- Trust Verto Draadloze Muis - € 12,99
- HP 912XL Inktcartridge Zwart - € 36,99
      `
    }
    
    const result2 = await analyzeEmail(simplifiedEmail)
    console.log('Simplified email result:')
    console.log(JSON.stringify(result2, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
testGeminiWithCoolblue()