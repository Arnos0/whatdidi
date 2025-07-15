'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId, isLoaded } = useAuth()
  const hasSynced = useRef(false)

  useEffect(() => {
    async function syncUser() {
      // Wait for auth to be loaded and ensure user is signed in
      if (!isLoaded || !isSignedIn || !userId || hasSynced.current) return
      
      try {
        hasSynced.current = true
        const response = await fetch('/api/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('Failed to sync user:', response.status, errorData)
          // Allow retry on error by resetting the flag
          hasSynced.current = false
        } else {
          console.log('User synced successfully')
        }
      } catch (error) {
        console.error('Error syncing user:', error)
        // Allow retry on error by resetting the flag
        hasSynced.current = false
      }
    }

    // Add a small delay to ensure all auth context is ready
    const timer = setTimeout(syncUser, 100)
    return () => clearTimeout(timer)
  }, [isLoaded, isSignedIn, userId])

  return <>{children}</>
}