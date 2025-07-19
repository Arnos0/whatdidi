'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Signal, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNetworkState } from '@/hooks/use-network-state'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface NetworkStatusProps {
  showWhenOnline?: boolean
  className?: string
}

export function NetworkStatus({ showWhenOnline = false, className = '' }: NetworkStatusProps) {
  const networkState = useNetworkState()
  const prefersReducedMotion = useReducedMotion()
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!networkState.isOnline) {
      setWasOffline(true)
    } else if (wasOffline && networkState.isOnline) {
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
        setWasOffline(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [networkState.isOnline, wasOffline])

  const shouldShow = !networkState.isOnline || networkState.isSlowConnection || showReconnected || showWhenOnline

  if (!shouldShow) return null

  const getStatusInfo = () => {
    if (!networkState.isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        message: 'You are offline',
        description: 'Some features may not be available',
        variant: 'destructive' as const,
        showRetry: true
      }
    }
    
    if (showReconnected) {
      return {
        icon: <Wifi className="h-4 w-4" />,
        message: 'Connected',
        description: 'You are back online',
        variant: 'success' as const,
        showRetry: false
      }
    }
    
    if (networkState.isSlowConnection) {
      return {
        icon: <Signal className="h-4 w-4" />,
        message: 'Slow connection',
        description: 'Some features may load slowly',
        variant: 'warning' as const,
        showRetry: false
      }
    }
    
    return {
      icon: <Wifi className="h-4 w-4" />,
      message: 'Online',
      description: `${networkState.effectiveType?.toUpperCase() || 'Connected'}`,
      variant: 'success' as const,
      showRetry: false
    }
  }

  const statusInfo = getStatusInfo()

  const handleRetry = () => {
    window.location.reload()
  }

  const baseStyles = {
    destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    success: 'bg-success-50 border-success-200 text-success-800'
  }

  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: -20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.95 },
        transition: { duration: 0.3, type: "spring", stiffness: 300, damping: 30 }
      }

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        {...animationProps}
      >
        <Card className={`p-3 ${baseStyles[statusInfo.variant]} border`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {statusInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                {statusInfo.message}
              </div>
              <div className="text-xs opacity-80">
                {statusInfo.description}
              </div>
            </div>
            {statusInfo.showRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="h-8 px-3 text-xs"
              >
                Retry
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

interface OfflineIndicatorProps {
  className?: string
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const { isOnline } = useNetworkState()
  const prefersReducedMotion = useReducedMotion()

  if (isOnline) return null

  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      }

  return (
    <AnimatePresence>
      <motion.div
        className={`flex items-center gap-2 text-destructive text-sm ${className}`}
        {...animationProps}
      >
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
      </motion.div>
    </AnimatePresence>
  )
}

interface ConnectionQualityIndicatorProps {
  className?: string
  showDetails?: boolean
}

export function ConnectionQualityIndicator({ 
  className = '', 
  showDetails = false 
}: ConnectionQualityIndicatorProps) {
  const networkState = useNetworkState()

  if (!networkState.isOnline) {
    return (
      <div className={`flex items-center gap-2 text-destructive ${className}`}>
        <WifiOff className="h-4 w-4" />
        {showDetails && <span className="text-xs">Offline</span>}
      </div>
    )
  }

  const getQualityInfo = () => {
    if (networkState.isSlowConnection) {
      return {
        icon: <Signal className="h-4 w-4 text-warning-600" />,
        text: networkState.effectiveType?.toUpperCase() || 'Slow',
        color: 'text-warning-600'
      }
    }

    return {
      icon: <Wifi className="h-4 w-4 text-success-600" />,
      text: networkState.effectiveType?.toUpperCase() || 'Good',
      color: 'text-success-600'
    }
  }

  const quality = getQualityInfo()

  return (
    <div className={`flex items-center gap-2 ${quality.color} ${className}`}>
      {quality.icon}
      {showDetails && (
        <span className="text-xs">
          {quality.text}
          {networkState.rtt && ` (${networkState.rtt}ms)`}
        </span>
      )}
    </div>
  )
}