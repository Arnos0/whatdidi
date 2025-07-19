'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNetworkState } from './use-network-state'
import { toast } from 'sonner'

export interface QueuedOperation {
  id: string
  operation: () => Promise<any>
  retryCount: number
  maxRetries: number
  description: string
  timestamp: number
}

const MAX_QUEUE_SIZE = 50
const RETRY_DELAY = 2000

export function useRetryQueue() {
  const [queue, setQueue] = useState<QueuedOperation[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { isOnline } = useNetworkState()

  const addToQueue = useCallback((
    operation: () => Promise<any>,
    description: string,
    maxRetries: number = 3
  ): string => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const queuedOp: QueuedOperation = {
      id,
      operation,
      retryCount: 0,
      maxRetries,
      description,
      timestamp: Date.now()
    }

    setQueue(prev => {
      const newQueue = [...prev, queuedOp]
      // Limit queue size to prevent memory issues
      if (newQueue.length > MAX_QUEUE_SIZE) {
        return newQueue.slice(-MAX_QUEUE_SIZE)
      }
      return newQueue
    })

    toast.info(`Operation queued: ${description}`)
    return id
  }, [])

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(op => op.id !== id))
  }, [])

  const processQueue = useCallback(async () => {
    if (!isOnline || isProcessing || queue.length === 0) return

    setIsProcessing(true)
    const operations = [...queue]

    for (const op of operations) {
      try {
        await op.operation()
        removeFromQueue(op.id)
        toast.success(`Completed: ${op.description}`)
      } catch (error) {
        console.error(`Failed to process queued operation ${op.id}:`, error)
        
        setQueue(prev => prev.map(queuedOp => {
          if (queuedOp.id === op.id) {
            const newRetryCount = queuedOp.retryCount + 1
            
            if (newRetryCount >= queuedOp.maxRetries) {
              toast.error(`Failed after ${queuedOp.maxRetries} attempts: ${queuedOp.description}`)
              return null // Will be filtered out
            }
            
            return {
              ...queuedOp,
              retryCount: newRetryCount
            }
          }
          return queuedOp
        }).filter(Boolean) as QueuedOperation[])

        // Add delay between retries
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      }
    }

    setIsProcessing(false)
  }, [isOnline, isProcessing, queue, removeFromQueue])

  const clearQueue = useCallback(() => {
    setQueue([])
    toast.info('Retry queue cleared')
  }, [])

  const retryOperation = useCallback(async (id: string) => {
    const operation = queue.find(op => op.id === id)
    if (!operation) return

    try {
      await operation.operation()
      removeFromQueue(id)
      toast.success(`Completed: ${operation.description}`)
    } catch (error) {
      console.error(`Manual retry failed for operation ${id}:`, error)
      toast.error(`Retry failed: ${operation.description}`)
    }
  }, [queue, removeFromQueue])

  // Auto-process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      const timer = setTimeout(() => {
        processQueue()
      }, 1000) // Small delay to ensure connection is stable

      return () => clearTimeout(timer)
    }
  }, [isOnline, queue.length, processQueue])

  return {
    queue,
    queueSize: queue.length,
    isProcessing,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,
    retryOperation
  }
}