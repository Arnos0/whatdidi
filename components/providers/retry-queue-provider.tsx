'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useRetryQueue } from '@/hooks/use-retry-queue'

interface RetryQueueContextType {
  queue: any[]
  queueSize: number
  isProcessing: boolean
  addToQueue: (operation: () => Promise<any>, description: string, maxRetries?: number) => string
  removeFromQueue: (id: string) => void
  processQueue: () => Promise<void>
  clearQueue: () => void
  retryOperation: (id: string) => Promise<void>
}

const RetryQueueContext = createContext<RetryQueueContextType | undefined>(undefined)

export function RetryQueueProvider({ children }: { children: ReactNode }) {
  const retryQueue = useRetryQueue()

  return (
    <RetryQueueContext.Provider value={retryQueue}>
      {children}
    </RetryQueueContext.Provider>
  )
}

export function useRetryQueueContext() {
  const context = useContext(RetryQueueContext)
  if (context === undefined) {
    throw new Error('useRetryQueueContext must be used within a RetryQueueProvider')
  }
  return context
}