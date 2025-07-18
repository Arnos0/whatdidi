'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, ExternalLink, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ManualOrderButtonProps {
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  className?: string
}

export function ManualOrderButton({ 
  variant = 'default', 
  size = 'default', 
  showIcon = true,
  className = ''
}: ManualOrderButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleOpenManualForm = () => {
    // For MVP, we'll direct users to the n8n form
    // In production, this would be the actual n8n form URL
    const n8nFormUrl = 'https://n8n.whatdidi.shop/form/manual-order'
    
    // For now, we'll just show the instructions
    setIsDialogOpen(true)
  }

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={handleOpenManualForm}
        className={className}
      >
        {showIcon && <Plus className="h-4 w-4 mr-2" />}
        Add Order Manually
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Order Manually
            </DialogTitle>
            <DialogDescription>
              Use our quick form to add orders that weren&apos;t automatically detected.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">MVP Manual Entry</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Fill out our simple form to add orders manually. Perfect for receipts, 
                    in-store purchases, or orders from emails we haven&apos;t processed yet.
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <h4 className="font-medium">What you&apos;ll need:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Order number (if available)</li>
                <li>• Store/retailer name</li>
                <li>• Order amount</li>
                <li>• Purchase date</li>
                <li>• Tracking number (optional)</li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                🚀 MVP Feature
              </Badge>
              <Badge variant="outline" className="text-xs">
                Takes 2 minutes
              </Badge>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button 
                className="w-full" 
                onClick={() => {
                  // For demo purposes, we&apos;ll just show alert
                  // In production, this would open the n8n form
                  alert('🚧 Coming soon! The n8n form will open here.')
                  setIsDialogOpen(false)
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Manual Entry Form
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2">
              Your manually added orders will appear in your dashboard immediately.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}