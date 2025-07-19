'use client'

import { useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  enabled?: boolean
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80, 
  enabled = true 
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const touchStartY = useRef<number>(0)
  const lastTouchY = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    let rafId: number

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop > 0) return
      
      touchStartY.current = e.touches[0].clientY
      lastTouchY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (container.scrollTop > 0 || isRefreshing) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - touchStartY.current

      if (deltaY > 0) {
        e.preventDefault()
        
        // Calculate pull distance with diminishing returns
        const distance = Math.min(deltaY * 0.5, threshold * 1.5)
        
        rafId = requestAnimationFrame(() => {
          setPullDistance(distance)
          setIsPulling(distance > 0)
        })
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return

      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setTimeout(() => {
            setIsRefreshing(false)
            setPullDistance(0)
            setIsPulling(false)
          }, 500) // Small delay for smooth animation
        }
      } else {
        // Animate back to 0
        const startDistance = pullDistance
        const startTime = Date.now()
        const duration = 200

        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const easeOut = 1 - Math.pow(1 - progress, 3)
          
          const currentDistance = startDistance * (1 - easeOut)
          setPullDistance(currentDistance)
          
          if (progress < 1) {
            rafId = requestAnimationFrame(animate)
          } else {
            setIsPulling(false)
          }
        }
        
        animate()
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [enabled, isRefreshing, isPulling, pullDistance, threshold, onRefresh])

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling,
    canRefresh: pullDistance >= threshold
  }
}