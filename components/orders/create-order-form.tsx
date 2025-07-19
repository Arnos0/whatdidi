'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOrderSchema, type CreateOrderInput } from '@/lib/validation/order-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Card } from '@/components/ui/card'
import { X, Plus, Upload } from 'lucide-react'
import { CARRIERS } from '@/lib/validation/order-form'
import { RetailerCombobox } from './retailer-combobox'
import { useRetailers } from '@/hooks/use-retailers'
import Image from 'next/image'

interface CreateOrderFormProps {
  onSubmit: (data: CreateOrderInput) => Promise<void>
  isSubmitting?: boolean
}

export function CreateOrderForm({ onSubmit, isSubmitting }: CreateOrderFormProps) {
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const { data: retailersData } = useRetailers()
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      currency: 'EUR',
      status: 'pending',
      items: [{ description: '', quantity: 1 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const receiptFile = watch('receiptFile')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setValue('receiptFile', file)
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setReceiptPreview(null)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orderNumber">Order Number *</Label>
          <Input
            id="orderNumber"
            {...register('orderNumber')}
            placeholder="e.g. 123-4567890"
            className="mt-1"
          />
          {errors.orderNumber && (
            <p className="text-sm text-destructive mt-1">{errors.orderNumber.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="retailer">Retailer *</Label>
          <RetailerCombobox
            retailers={retailersData?.retailers || []}
            value={watch('retailer')}
            onValueChange={(value) => setValue('retailer', value)}
            className="mt-1"
          />
          {errors.retailer && (
            <p className="text-sm text-destructive mt-1">{errors.retailer.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0.00"
            className="mt-1"
          />
          {errors.amount && (
            <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="orderDate">Order Date *</Label>
          <DatePicker
            value={watch('orderDate')}
            onChange={(date) => setValue('orderDate', date || new Date())}
          />
          {errors.orderDate && (
            <p className="text-sm text-destructive mt-1">{errors.orderDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="trackingNumber">Tracking Number</Label>
          <Input
            id="trackingNumber"
            {...register('trackingNumber')}
            placeholder="Optional"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="carrier">Carrier</Label>
          <Select
            onValueChange={(value) => setValue('carrier', value as any)}
            defaultValue=""
          >
            <SelectTrigger id="carrier" className="mt-1">
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent>
              {CARRIERS.map((carrier) => (
                <SelectItem key={carrier} value={carrier}>
                  {carrier.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Order Items *</Label>
        <div className="space-y-3 mt-2">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Item description"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.items[index]?.description?.message}
                      </p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      type="number"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      placeholder="Quantity"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.price`, { 
                        setValueAs: (v) => v === "" ? undefined : parseFloat(v)
                      })}
                      placeholder="Price (optional)"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: '', quantity: 1 })}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="receiptFile">Receipt Upload</Label>
        <div className="mt-2">
          <label
            htmlFor="receiptFile"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
          >
            {receiptPreview ? (
              <Image
                src={receiptPreview}
                alt="Receipt preview"
                className="h-full object-contain"
                width={200}
                height={128}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF, WEBP or PDF (max 5MB)
                </p>
              </div>
            )}
            <input
              id="receiptFile"
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting} aria-label={isSubmitting ? 'Creating order' : 'Submit create order form'}>
          {isSubmitting ? 'Creating...' : 'Create Order'}
        </Button>
      </div>
    </form>
  )
}