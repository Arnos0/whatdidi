'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { RetryQueueProvider } from '@/components/providers/retry-queue-provider'
import { initializeTestTriggers } from '@/lib/utils/test-triggers'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Enhanced caching strategy
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            gcTime: 30 * 60 * 1000, // 30 minutes - garbage collection time
            
            // Background refetching
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
            
            // Retry configuration
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Network mode for offline support
            networkMode: 'offlineFirst',
          },
          mutations: {
            // Retry mutations once on network error
            retry: (failureCount, error: any) => {
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              return failureCount < 1
            },
            networkMode: 'offlineFirst',
          },
        },
      })
  )

  useEffect(() => {
    initializeTestTriggers()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RetryQueueProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </RetryQueueProvider>
    </QueryClientProvider>
  )
}