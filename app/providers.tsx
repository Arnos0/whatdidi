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
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
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