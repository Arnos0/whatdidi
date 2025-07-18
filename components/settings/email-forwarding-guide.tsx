'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { 
  Mail, 
  ArrowRight, 
  CheckCircle, 
  Info, 
  Copy, 
  ExternalLink,
  Zap,
  Shield,
  Globe
} from 'lucide-react'

export function EmailForwardingGuide() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  
  const forwardingEmail = 'sendto@whatdidi.shop'
  
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(forwardingEmail)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } catch (err) {
      console.error('Failed to copy email:', err)
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">Email Forwarding</h3>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                MVP Ready
              </Badge>
            </div>
            <p className="text-muted-foreground mb-4">
              Forward purchase confirmation emails to automatically detect and track orders. 
              Supports Dutch and English emails with AI-powered extraction.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Forward emails to:</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopyEmail}
                  className="h-8 px-3"
                >
                  <span className="font-mono">{forwardingEmail}</span>
                  <Copy className="h-3 w-3 ml-2" />
                </Button>
                {copiedEmail && (
                  <span className="text-sm text-green-600 font-medium">Copied!</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Dutch & English</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">Secure</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Info className="h-4 w-4 mr-2" />
                Setup Guide
              </Button>
              <Button variant="outline" onClick={handleCopyEmail}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Email
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Forwarding Setup Guide
            </DialogTitle>
            <DialogDescription>
              Automatically detect orders from Dutch and English emails using AI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Quick Setup */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">🚀 Quick Setup (2 minutes)</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">1</span>
                  <span className="text-blue-800">Forward purchase emails to:</span>
                  <code className="bg-blue-100 px-2 py-1 rounded text-blue-900">{forwardingEmail}</code>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">2</span>
                  <span className="text-blue-800">Orders appear in your dashboard automatically!</span>
                </div>
              </div>
            </div>

            {/* What We Process */}
            <div>
              <h4 className="font-semibold mb-3">📧 What We Process</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium text-green-700">✅ Supported Email Types:</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Order confirmations</li>
                    <li>• Shipping notifications</li>
                    <li>• Delivery updates</li>
                    <li>• Purchase receipts</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-green-700">✅ Popular Retailers:</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Coolblue, Bol.com, Amazon</li>
                    <li>• Albert Heijn, Jumbo</li>
                    <li>• H&M, Zara, Zalando</li>
                    <li>• And many more!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div>
              <h4 className="font-semibold mb-3">🌍 Language Support</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Dutch - Volledig ondersteund</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">English - Fully supported</span>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div>
              <h4 className="font-semibold mb-3">🛠 How It Works</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Forward email to sendto@whatdidi.shop</span>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">AI detects language and extracts order details</span>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Dutch amounts (€89,99) converted automatically</span>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Order appears in your dashboard</span>
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">🔐 Privacy & Security</h4>
              <ul className="text-sm space-y-1 text-green-800">
                <li>• No email storage - only order data extracted</li>
                <li>• All data encrypted in transit and at rest</li>
                <li>• Only you can see your orders</li>
                <li>• We never send emails to your forwarding address</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleCopyEmail}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Forwarding Email
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}