'use client'

import { useState, useEffect } from 'react'

export interface NetworkState {
  isOnline: boolean
  isSlowConnection: boolean
  effectiveType?: string
  rtt?: number
  downlink?: number
}

export function useNetworkState(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateNetworkState = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      const newState: NetworkState = {
        isOnline: navigator.onLine,
        isSlowConnection: false,
      }

      if (connection) {
        newState.effectiveType = connection.effectiveType
        newState.rtt = connection.rtt
        newState.downlink = connection.downlink
        
        // Consider connection slow if it's 2G or has high RTT/low downlink
        newState.isSlowConnection = 
          connection.effectiveType === '2g' ||
          connection.effectiveType === 'slow-2g' ||
          (connection.rtt && connection.rtt > 2000) ||
          (connection.downlink && connection.downlink < 0.5)
      }

      setNetworkState(newState)
    }

    const handleOnline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: false }))
    }

    const handleConnectionChange = () => {
      updateNetworkState()
    }

    // Initial state
    updateNetworkState()

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [])

  return networkState
}