'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void> | void
  enabled?: boolean
  className?: string
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  enabled = true,
  className 
}: PullToRefreshProps) {
  const { 
    containerRef, 
    isRefreshing, 
    pullDistance, 
    isPulling, 
    canRefresh 
  } = usePullToRefresh({ 
    onRefresh, 
    enabled 
  })

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{ 
        paddingTop: isPulling || isRefreshing ? Math.max(pullDistance, 0) : 0,
        transition: !isPulling && !isRefreshing ? 'padding-top 0.2s ease-out' : 'none'
      }}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
            style={{
              transform: `translateX(-50%) translateY(${Math.max(pullDistance - 60, -60)}px)`
            }}
          >
            <div className="bg-background/90 backdrop-blur-sm border rounded-full p-3 shadow-lg">
              {isRefreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5 text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ 
                    rotate: canRefresh ? 180 : 0,
                    scale: canRefresh ? 1.1 : 1
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowDown 
                    className={cn(
                      "h-5 w-5 transition-colors",
                      canRefresh ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                </motion.div>
              )}
            </div>
            
            {/* Helper text */}
            <div className="text-center mt-2">
              <span className="text-xs text-muted-foreground">
                {isRefreshing 
                  ? 'Refreshing...' 
                  : canRefresh 
                    ? 'Release to refresh' 
                    : 'Pull to refresh'
                }
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}