'use client'

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/analytics/web-vitals'

/**
 * Web Vitals Reporter Component
 * Initializes Web Vitals monitoring when mounted
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Initialize Web Vitals monitoring
    initWebVitals()
  }, [])

  // This component doesn't render anything
  return null
}