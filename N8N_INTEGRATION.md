# n8n Integration Guide for WhatDidiShop MVP

## Overview

This guide documents the n8n workflows that power the WhatDidiShop MVP. We use n8n Cloud for two primary workflows:
1. **Manual Order Entry** - Public form for users to add orders manually
2. **Email Forwarding** - Process forwarded emails to extract order data

## Prerequisites

- n8n Cloud account (https://n8n.io)
- Supabase project with proper schema
- Gemini API key for email parsing
- SMTP credentials for notifications
- Domain email forwarding setup (sendto@whatdidi.shop)

## API Webhook Endpoint

### Endpoint URL
```
POST https://app.whatdidi.shop/api/webhooks/n8n
```

### Authentication
- Header: `x-webhook-token`
- Value: Your secure webhook token (set in environment variable `N8N_WEBHOOK_TOKEN`)

### Payload Formats

#### Manual Order Payload
```json
{
  "type": "manual_order",
  "user_email": "user@example.com",
  "order": {
    "order_number": "12345",
    "retailer": "Coolblue",
    "amount": 89.99,
    "currency": "EUR",
    "order_date": "2024-01-18",
    "status": "confirmed",
    "tracking_number": "NL123456789",
    "carrier": "postnl",
    "estimated_delivery": "2024-01-20",
    "items": [
      {
        "description": "Product Name",
        "quantity": 1,
        "price": 89.99
      }
    ]
  }
}
```

#### Email Forwarding Payload
```json
{
  "type": "email",
  "user_email": "user@example.com",
  "email": {
    "from": "noreply@coolblue.nl",
    "subject": "Je bestelling is onderweg",
    "date": "2024-01-18T10:30:00Z",
    "body_plain": "Email content in plain text",
    "body_html": "<html>Email content in HTML</html>",
    "raw_email_data": {
      "headers": {},
      "attachments": []
    }
  }
}
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "order_id": "uuid-here",
  "needs_review": false,
  "confidence": 0.95,
  "detected_language": "nl",
  "message": "Order created successfully"
}
```

#### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Status Codes
- `200 OK` - Success
- `401 Unauthorized` - Invalid webhook token
- `404 Not Found` - User not found
- `400 Bad Request` - Invalid payload
- `500 Internal Server Error` - Processing error

## Workflow 1: Manual Order Entry

### Purpose
Allow users to manually add orders through a form when automated parsing isn't available.

### Trigger
**Webhook** - Creates a public form URL that can be embedded in the app

### Workflow Steps

#### 1. Webhook Trigger Configuration
```javascript
// Webhook Settings
Method: POST
Path: /manual-order
Authentication: Header Auth
Header Name: x-webhook-token
Credential: Create new with secure token
Response Mode: Last Node
```

#### 2. Validate Input (Code Node)
```javascript
// Input validation
const required = ['user_email', 'retailer', 'amount', 'order_date'];
const errors = [];

for (const field of required) {
  if (!$input.item.json[field]) {
    errors.push(`${field} is required`);
  }
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test($input.item.json.user_email)) {
  errors.push('Invalid email format');
}

// Validate amount
if ($input.item.json.amount <= 0) {
  errors.push('Amount must be positive');
}

if (errors.length > 0) {
  throw new Error(errors.join(', '));
}

return $input.item;
```

#### 3. Verify User (Supabase Node)
```sql
-- Query to verify user exists
SELECT id, email, name 
FROM users 
WHERE email = {{ $json.user_email }}
LIMIT 1
```

#### 4. Transform Data (Code Node)
```javascript
// Transform Dutch amounts and prepare data
function parseDutchAmount(amount) {
  if (typeof amount === 'string') {
    // "89,99" → 89.99
    // "1.234,56" → 1234.56
    return parseFloat(
      amount
        .replace(/\./g, '') // Remove thousand separators
        .replace(',', '.')  // Convert decimal comma
    );
  }
  return parseFloat(amount);
}

// Parse items if provided
let items = [];
if ($input.item.json.items) {
  try {
    items = JSON.parse($input.item.json.items);
  } catch (e) {
    // Ignore parse errors
  }
}

return {
  user_id: $input.first().json.id, // From user query
  retailer: $input.item.json.retailer,
  amount: parseDutchAmount($input.item.json.amount),
  currency: $input.item.json.currency || 'EUR',
  order_date: $input.item.json.order_date,
  order_number: $input.item.json.order_number || null,
  status: $input.item.json.status || 'pending',
  tracking_number: $input.item.json.tracking_number || null,
  carrier: $input.item.json.carrier || null,
  estimated_delivery: $input.item.json.estimated_delivery || null,
  receipt_url: $input.item.json.receipt_url || null,
  is_manual: true,
  needs_review: false,
  created_at: new Date().toISOString(),
  items: items
};
```

#### 5. Insert Order (Supabase Node)
```sql
-- Insert into orders table
INSERT INTO orders (
  user_id, retailer, amount, currency, order_date,
  order_number, status, tracking_number, carrier,
  estimated_delivery, receipt_url, is_manual, needs_review
)
VALUES (
  {{ $json.user_id }},
  {{ $json.retailer }},
  {{ $json.amount }},
  {{ $json.currency }},
  {{ $json.order_date }},
  {{ $json.order_number }},
  {{ $json.status }},
  {{ $json.tracking_number }},
  {{ $json.carrier }},
  {{ $json.estimated_delivery }},
  {{ $json.receipt_url }},
  {{ $json.is_manual }},
  {{ $json.needs_review }}
)
RETURNING id;
```

#### 6. Insert Order Items (Loop)
```javascript
// If items exist, loop through and insert
// Use the order_id from previous step
```

#### 7. Send Confirmation Email (SMTP Node)
```
To: {{ $node["Transform Data"].json.user_email }}
Subject: Order Added Successfully
Body: 
Your order from {{ retailer }} for €{{ amount }} has been added successfully.
Order Date: {{ order_date }}
{{ #if order_number }}Order Number: {{ order_number }}{{ /if }}
```

### Form Fields
```yaml
user_email:
  type: email
  required: true
  label: "Your Email"
  placeholder: "user@example.com"

retailer:
  type: text
  required: true
  label: "Store/Retailer"
  placeholder: "Amazon"
  maxLength: 100

amount:
  type: number
  required: true
  label: "Total Amount"
  placeholder: "49.99"
  min: 0.01
  step: 0.01

currency:
  type: select
  label: "Currency"
  default: "EUR"
  options: ["EUR", "USD", "GBP"]

order_date:
  type: date
  required: true
  label: "Order Date"
  max: today

order_number:
  type: text
  label: "Order Number (optional)"
  placeholder: "12345678"

status:
  type: select
  label: "Status"
  default: "pending"
  options: 
    - value: "pending"
      label: "Pending"
    - value: "shipped"
      label: "Shipped"
    - value: "delivered"
      label: "Delivered"

tracking_number:
  type: text
  label: "Tracking Number (optional)"

carrier:
  type: text
  label: "Carrier (optional)"
  placeholder: "DHL"

estimated_delivery:
  type: date
  label: "Expected Delivery (optional)"

receipt_url:
  type: url
  label: "Receipt URL (optional)"

items:
  type: textarea
  label: "Items (optional JSON)"
  placeholder: '[{"name": "Product", "quantity": 1, "price": 49.99}]'
```

## Workflow 2: Email Forwarding Processor

### Purpose
Process emails forwarded to sendto@whatdidi.shop to automatically extract order information.

### Trigger
**Email Trigger (IMAP)** - Polls for new emails every 5 minutes

### IMAP Configuration
```yaml
Host: imap.whatdidi.shop
Port: 993
SSL: Yes
Username: sendto@whatdidi.shop
Password: [Secure credential]
Mailbox: INBOX
Action: Mark as Read
Poll Time: 5 minutes
```

### Workflow Steps

#### 1. Extract Email Data (Code Node)
```javascript
// Extract sender and content
const email = $input.item.json;
return {
  sender: email.from.value[0].address,
  subject: email.subject,
  textBody: email.text || '',
  htmlBody: email.html || '',
  date: email.date,
  messageId: email.messageId
};
```

#### 2. Verify Sender (Supabase Node)
```sql
-- Check if sender is a registered user
SELECT id, email, name
FROM users
WHERE email = {{ $json.sender }}
LIMIT 1
```

#### 3. Prepare for AI (Code Node)
```javascript
// Prepare email content for Gemini
const content = $input.item.json;

// Prefer plain text over HTML
let body = content.textBody || content.htmlBody || '';

// Limit to 10000 characters
if (body.length > 10000) {
  body = body.substring(0, 10000);
}

// Detect language (simple check)
const dutchKeywords = ['bestelling', 'bedankt', 'levering', 'bezorging'];
const isDutch = dutchKeywords.some(keyword => 
  body.toLowerCase().includes(keyword)
);

return {
  email: {
    subject: content.subject,
    from: content.sender,
    body: body,
    date: content.date
  },
  language: isDutch ? 'nl' : 'en',
  user_id: $node["Verify Sender"].json[0].id
};
```

#### 4. Call Gemini API (HTTP Request Node)
```javascript
// Gemini API Configuration
URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
Method: POST
Authentication: API Key
Headers:
  Content-Type: application/json

Body:
{
  "contents": [{
    "parts": [{
      "text": "{{ $node["Prepare for AI"].json.prompt }}"
    }]
  }],
  "generationConfig": {
    "temperature": 0.1,
    "maxOutputTokens": 2048
  }
}
```

#### 5. Parse AI Response (Code Node)
```javascript
// Parse Gemini response and transform data
const response = $input.item.json;
const aiText = response.candidates[0].content.parts[0].text;

// Extract JSON from response
const jsonMatch = aiText.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('No JSON found in AI response');
}

const parsed = JSON.parse(jsonMatch[0]);

if (!parsed.isOrder) {
  // Not an order - send notification
  return {
    isOrder: false,
    sender: $node["Extract Email Data"].json.sender
  };
}

// Transform AI data to database format
const order = parsed.orderData;

// Status mapping
const statusMap = {
  'confirmed': 'pending',
  'bevestigd': 'pending',
  'shipped': 'shipped',
  'verzonden': 'shipped',
  'delivered': 'delivered',
  'geleverd': 'delivered'
};

return {
  isOrder: true,
  order: {
    user_id: $node["Prepare for AI"].json.user_id,
    order_number: order.orderNumber || null,
    retailer: order.retailer || 'Unknown',
    amount: parseFloat(String(order.amount).replace(',', '.')),
    currency: order.currency || 'EUR',
    order_date: order.orderDate || new Date().toISOString(),
    status: statusMap[order.status] || 'pending',
    tracking_number: order.trackingNumber || null,
    carrier: order.carrier || null,
    estimated_delivery: order.estimatedDelivery || null,
    is_manual: false,
    needs_review: order.confidence < 0.7,
    raw_email_data: {
      subject: $node["Extract Email Data"].json.subject,
      from: $node["Extract Email Data"].json.sender,
      snippet: $node["Extract Email Data"].json.textBody.substring(0, 500)
    }
  },
  items: order.items || [],
  confidence: order.confidence || 0
};
```

#### 6. Check Existing Order (Supabase Node)
```sql
-- Check if order already exists
SELECT id, order_number, retailer
FROM orders
WHERE user_id = {{ $json.order.user_id }}
  AND order_number = {{ $json.order.order_number }}
  AND retailer = {{ $json.order.retailer }}
LIMIT 1
```

#### 7. Insert/Update Order (If Node)
- **If exists**: Update existing order
- **If new**: Insert new order

#### 8. Send Notification (SMTP Node)
```
To: {{ sender_email }}
Subject: Order {{ success ? "Processed" : "Processing Failed" }}

{{ #if success }}
Your order from {{ retailer }} has been processed successfully.
Amount: €{{ amount }}
{{ #if needs_review }}
Note: This order has been marked for review due to low confidence parsing.
{{ /if }}
{{ else }}
We couldn't process your forwarded email. Please use the manual entry form.
{{ /if }}
```

## Security Considerations

### Webhook Authentication
- Use secure random tokens (min 32 characters)
- Rotate tokens regularly
- Store tokens in n8n credentials, not workflow

### Input Validation
- Validate all required fields
- Sanitize HTML content
- Limit string lengths
- Validate email formats
- Check numeric ranges

### Rate Limiting
- Implement per-user limits (e.g., 100 orders/day)
- Add cooldown between submissions
- Monitor for abuse patterns

### Error Handling
- Log errors to monitoring service
- Send admin notifications for failures
- Graceful user-facing error messages
- Never expose internal errors

## Testing

### Manual Order Form Testing
1. Test with valid data
2. Test missing required fields
3. Test invalid email format
4. Test negative amounts
5. Test Dutch number formats
6. Test with non-existent user
7. Test items JSON parsing

### Email Forwarding Testing
1. Forward order from registered user
2. Forward order from unregistered user
3. Forward non-order email
4. Test Dutch language detection
5. Test low-confidence parsing
6. Test duplicate order handling
7. Test various retailer formats

## Monitoring

### Key Metrics
- Form submission success rate
- Email parsing success rate
- Average confidence score
- Processing time per workflow
- Error rate by type

### Alerts
- Workflow failures
- Low parsing confidence trend
- Unusual submission patterns
- Database connection issues

## Troubleshooting

### Common Issues

#### Form Not Submitting
- Check webhook token
- Verify CORS settings
- Check field validation
- Review browser console

#### Email Not Processing
- Verify IMAP credentials
- Check email forwarding setup
- Review sender verification
- Check Gemini API quota

#### Orders Not Saving
- Verify database connection
- Check user exists
- Review field mappings
- Check for duplicates

#### Low Confidence Parsing
- Review email format
- Check language detection
- Verify retailer patterns
- Consider manual entry

## Maintenance

### Regular Tasks
1. Review flagged orders weekly
2. Update retailer patterns monthly
3. Monitor API costs
4. Check email queue health
5. Rotate security tokens quarterly

### Performance Optimization
- Batch process emails during off-peak
- Cache user lookups
- Optimize Gemini prompts
- Archive old processed emails

## Future Enhancements
- Add more languages (Phase 2)
- Implement OAuth scanning (Phase 2)
- Add receipt OCR processing
- Support attachment parsing
- Implement auto-retry logic