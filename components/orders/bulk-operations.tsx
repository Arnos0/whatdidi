'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trash2, 
  Archive, 
  Download, 
  CheckSquare, 
  Square,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useErrorTracking } from '@/lib/utils/error-tracking'
import { toast } from 'sonner'
import type { Order } from '@/lib/supabase/types'

interface BulkOperationsProps {
  orders: Order[]
  selectedOrders: string[]
  onSelectionChange: (orderIds: string[]) => void
  onBulkAction: (action: string, orderIds: string[]) => Promise<void>
  className?: string
}

interface OperationResult {
  success: string[]
  failed: { id: string; error: string }[]
  skipped: string[]
}

export function BulkOperations({
  orders,
  selectedOrders,
  onSelectionChange,
  onBulkAction,
  className = ''
}: BulkOperationsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<OperationResult | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const { captureComponentError } = useErrorTracking()

  const isAllSelected = selectedOrders.length === orders.length && orders.length > 0
  const isPartiallySelected = selectedOrders.length > 0 && selectedOrders.length < orders.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(orders.map(order => order.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) return

    setPendingAction(action)
    setIsConfirmOpen(true)
  }

  const executeBulkAction = async () => {
    if (!pendingAction || selectedOrders.length === 0) return

    setIsProcessing(true)
    setIsConfirmOpen(false)

    const result: OperationResult = {
      success: [],
      failed: [],
      skipped: []
    }

    try {
      // Process orders in batches to avoid overwhelming the server
      const batchSize = 10
      const batches = []
      
      for (let i = 0; i < selectedOrders.length; i += batchSize) {
        batches.push(selectedOrders.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (orderId) => {
          try {
            await onBulkAction(pendingAction, [orderId])
            result.success.push(orderId)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            result.failed.push({ id: orderId, error: errorMessage })
            
            captureComponentError(
              error instanceof Error ? error : new Error(errorMessage),
              'BulkOperations',
              `bulk-${pendingAction}`,
              { orderId, action: pendingAction }
            )
          }
        })

        await Promise.allSettled(batchPromises)
        
        // Small delay between batches to prevent rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      setLastResult(result)
      
      // Show summary toast
      if (result.success.length > 0) {
        toast.success(
          `Successfully ${pendingAction}d ${result.success.length} order${result.success.length > 1 ? 's' : ''}`
        )
      }
      
      if (result.failed.length > 0) {
        toast.error(
          `Failed to ${pendingAction} ${result.failed.length} order${result.failed.length > 1 ? 's' : ''}`
        )
      }

      // Clear selection for successful operations
      const remainingSelected = selectedOrders.filter(id => 
        !result.success.includes(id)
      )
      onSelectionChange(remainingSelected)

    } catch (error) {
      captureComponentError(
        error instanceof Error ? error : new Error('Bulk operation failed'),
        'BulkOperations',
        'executeBulkAction',
        { action: pendingAction, selectedCount: selectedOrders.length }
      )
      
      toast.error(`Failed to ${pendingAction} orders`)
    } finally {
      setIsProcessing(false)
      setPendingAction(null)
    }
  }

  const getActionConfig = (action: string) => {
    const configs = {
      delete: {
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive' as const,
        description: 'This will permanently delete the selected orders',
        confirmText: 'Delete Orders'
      },
      archive: {
        label: 'Archive',
        icon: <Archive className="h-4 w-4" />,
        variant: 'outline' as const,
        description: 'This will archive the selected orders',
        confirmText: 'Archive Orders'
      },
      export: {
        label: 'Export',
        icon: <Download className="h-4 w-4" />,
        variant: 'outline' as const,
        description: 'This will export the selected orders to CSV',
        confirmText: 'Export Orders'
      }
    }
    return configs[action as keyof typeof configs]
  }

  const animationProps = prefersReducedMotion ? {} : {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 }
  }

  if (orders.length === 0) return null

  return (
    <>
      <AnimatePresence>
        {selectedOrders.length > 0 && (
          <motion.div className={className} {...animationProps}>
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input && isPartiallySelected) {
                        input.indeterminate = true
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                    aria-label={isAllSelected ? "Deselect all orders" : "Select all orders"}
                  />
                  <span className="text-sm font-medium">
                    {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
                  </span>
                  <Badge variant="outline">
                    {selectedOrders.length} / {orders.length}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick Actions */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('export')}
                    disabled={isProcessing}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('archive')}
                    disabled={isProcessing}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectionChange([])}
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Operation Result */}
              {lastResult && (
                <motion.div 
                  className="mt-4 p-3 bg-muted/50 rounded-lg"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-2 text-sm">
                    {lastResult.success.length > 0 && (
                      <div className="text-success-600">
                        ✓ {lastResult.success.length} order{lastResult.success.length > 1 ? 's' : ''} processed successfully
                      </div>
                    )}
                    {lastResult.failed.length > 0 && (
                      <div className="text-destructive">
                        ✗ {lastResult.failed.length} order{lastResult.failed.length > 1 ? 's' : ''} failed
                      </div>
                    )}
                    {lastResult.skipped.length > 0 && (
                      <div className="text-warning-600">
                        ⚠ {lastResult.skipped.length} order{lastResult.skipped.length > 1 ? 's' : ''} skipped
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              Confirm Bulk Action
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {pendingAction && getActionConfig(pendingAction)?.description}
              </p>
              <p className="font-medium">
                This will affect {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''}:
              </p>
              <div className="max-h-32 overflow-y-auto bg-muted/50 p-2 rounded text-xs">
                {selectedOrders.map((orderId, index) => {
                  const order = orders.find(o => o.id === orderId)
                  return (
                    <div key={orderId}>
                      {index + 1}. #{order?.order_number} - {order?.retailer}
                    </div>
                  )
                })}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              className={
                pendingAction === 'delete' 
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {pendingAction && getActionConfig(pendingAction)?.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}