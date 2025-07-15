'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import type { Order, OrderStatus } from '@/lib/supabase/types'
import { Save, X } from 'lucide-react'

interface OrderEditFormProps {
  order: Order
  onSave: (updates: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function OrderEditForm({ order, onSave, onCancel, isLoading = false }: OrderEditFormProps) {
  const [formData, setFormData] = useState({
    status: order.status,
    tracking_number: order.tracking_number || '',
    carrier: order.carrier || '',
    estimated_delivery: order.estimated_delivery 
      ? new Date(order.estimated_delivery).toISOString().split('T')[0] 
      : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const updates: any = {
      status: formData.status,
      tracking_number: formData.tracking_number || undefined,
      carrier: formData.carrier || undefined,
    }

    if (formData.estimated_delivery) {
      updates.estimated_delivery = new Date(formData.estimated_delivery).toISOString()
    }

    await onSave(updates)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Edit Order Details</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Input
              id="carrier"
              type="text"
              value={formData.carrier}
              onChange={(e) => handleChange('carrier', e.target.value)}
              placeholder="e.g., PostNL, DHL, DPD"
            />
          </div>

          <div>
            <Label htmlFor="tracking_number">Tracking Number</Label>
            <Input
              id="tracking_number"
              type="text"
              value={formData.tracking_number}
              onChange={(e) => handleChange('tracking_number', e.target.value)}
              placeholder="Enter tracking number"
            />
          </div>

          <div>
            <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
            <Input
              id="estimated_delivery"
              type="date"
              value={formData.estimated_delivery}
              onChange={(e) => handleChange('estimated_delivery', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}