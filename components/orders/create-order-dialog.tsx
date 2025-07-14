'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateOrderForm } from './create-order-form'
import { type CreateOrderInput } from '@/lib/validation/order-form'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateOrder: (data: CreateOrderInput) => Promise<void>
  isCreating?: boolean
}

export function CreateOrderDialog({ 
  open, 
  onOpenChange, 
  onCreateOrder,
  isCreating 
}: CreateOrderDialogProps) {
  const handleSubmit = async (data: CreateOrderInput) => {
    await onCreateOrder(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Order</DialogTitle>
          <DialogDescription>
            Manually add an order to track. You can upload a receipt for reference.
          </DialogDescription>
        </DialogHeader>
        <CreateOrderForm 
          onSubmit={handleSubmit} 
          isSubmitting={isCreating}
        />
      </DialogContent>
    </Dialog>
  )
}