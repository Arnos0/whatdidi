'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth()
  const hasSynced = useRef(false)

  useEffect(() => {
    async function syncUser() {
      if (!isSignedIn || !userId || hasSynced.current) return
      
      try {
        hasSynced.current = true
        const response = await fetch('/api/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error('Failed to sync user')
          // Allow retry on error by resetting the flag
          hasSynced.current = false
        }
      } catch (error) {
        console.error('Error syncing user:', error)
        // Allow retry on error by resetting the flag
        hasSynced.current = false
      }
    }

    syncUser()
  }, [isSignedIn, userId])

  return <>{children}</>
}