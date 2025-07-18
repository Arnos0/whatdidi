# Email Forwarding Setup Guide
**WhatDidiShop MVP - Automatic Order Detection**

## Overview

This guide helps you set up email forwarding so WhatDidiShop can automatically detect and track your orders from Dutch and English emails. Simply forward purchase confirmation emails to our processing address, and we'll extract the order details using AI.

## 🚀 Quick Setup (2 minutes)

### Step 1: Forward Purchase Emails
Forward any purchase confirmation emails to:
```
sendto@whatdidi.shop
```

### Step 2: That's it!
Our system will automatically:
- Detect the language (Dutch/English)
- Extract order details (number, amount, retailer)
- Add orders to your dashboard
- Handle Dutch number formats (€1.234,56)

## 📧 Email Types We Process

### ✅ **Supported Email Types:**
- **Order confirmations** - "Bestelling bevestigd", "Order confirmed"
- **Shipping notifications** - "Pakket onderweg", "Package shipped"
- **Delivery updates** - "Bezorgd", "Delivered"
- **Purchase receipts** - from any retailer

### ✅ **Supported Languages:**
- **Dutch** - Volledig ondersteund
- **English** - Fully supported

### ✅ **Popular Retailers:**
- Coolblue, Bol.com, Amazon, Zalando
- Albert Heijn, Jumbo, MediaMarkt
- H&M, Zara, HEMA, Action
- And many more!

## 🛠 How It Works

1. **Email Forwarding**: You forward purchase emails to sendto@whatdidi.shop
2. **Language Detection**: Our system detects Dutch or English
3. **AI Processing**: Gemini AI extracts order details
4. **Number Formatting**: Dutch amounts (€89,99) converted to standard format
5. **Confidence Check**: Low confidence orders flagged for review
6. **Dashboard Update**: Orders appear in your dashboard immediately

## 📱 Manual Entry Alternative

For receipts or orders that can't be forwarded, use our manual entry form:
- Click "Add Order Manually" in your dashboard
- Fill out the simple form (2 minutes)
- Order appears immediately

## 🔐 Privacy & Security

- **No Email Storage**: We only extract order data, emails are processed and discarded
- **Secure Processing**: All data encrypted in transit and at rest
- **User Data**: Only you can see your orders
- **No Spam**: We never send emails to your forwarding address

## 📊 Processing Examples

### Dutch Email Example:
```
Van: noreply@coolblue.nl
Onderwerp: Je bestelling is onderweg

Hallo,
Je bestelling #123456 van €89,99 is verzonden.
Tracking: NL987654321
```

**Result**: Order automatically added with €89.99 amount, tracking number, and "shipped" status.

### English Email Example:
```
From: orders@amazon.com
Subject: Your order has been shipped

Hello,
Your order #456789 for $45.99 has been shipped.
Tracking: 1Z999AA1234567890
```

**Result**: Order automatically added with $45.99 amount, tracking number, and "shipped" status.

## ⚡ Pro Tips

### Get Better Results:
- Forward the **entire email** (don't edit or clip)
- Include **order confirmation emails** for complete details
- Forward **shipping notifications** for tracking updates
- Use **descriptive subject lines** when possible

### Common Issues:
- **Missing order numbers**: We'll auto-generate one
- **No amounts**: We'll extract from email content
- **Multiple items**: We'll list all items found
- **Low confidence**: Orders flagged for manual review

## 🎯 What Happens Next

### High Confidence Orders (>70%):
- ✅ Automatically added to dashboard
- ✅ All details extracted
- ✅ Ready to track

### Low Confidence Orders (<70%):
- ⚠️ Added with "Needs Review" flag
- ⚠️ Available in dashboard with review indicator
- ⚠️ You can edit/confirm details

## 🔧 Troubleshooting

### Email Not Processed?
1. Check if email is in Dutch or English
2. Verify it's from a retailer/purchase
3. Make sure it contains order information
4. Try forwarding the original confirmation email

### Wrong Details Extracted?
1. Orders with low confidence are flagged for review
2. You can edit any order details in the dashboard
3. Use manual entry for complex orders

### Need Help?
- Check your dashboard for processing status
- Low confidence orders will be flagged
- Use manual entry as backup option

## 📈 MVP Features

### Current Features:
- ✅ Dutch and English language support
- ✅ AI-powered order extraction
- ✅ Automatic number format conversion
- ✅ Confidence-based review system
- ✅ Manual entry backup option

### Coming Soon:
- 🔄 Real-time email processing
- 🔄 More language support
- 🔄 Enhanced retailer detection
- 🔄 Delivery tracking integration

## 🚀 Getting Started

1. **Forward your first email** to sendto@whatdidi.shop
2. **Check your dashboard** for the new order
3. **Review and confirm** any flagged orders
4. **Keep forwarding** purchase emails as they arrive

---

**Need help?** The system will guide you through any issues, and you can always use manual entry for immediate order tracking.

**Privacy Note**: We only process order information and never store your email content. Your purchase data is private and secure.