'use client'

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals'

// Types for Web Vitals data
export interface WebVitalsData {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
  url: string
  timestamp: number
}

// Performance thresholds based on Core Web Vitals standards
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
}

/**
 * Get performance rating based on metric value and thresholds
 */
function getPerformanceRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Send metric data to analytics endpoint
 */
async function sendToAnalytics(metric: WebVitalsData): Promise<void> {
  try {
    // Dispatch custom event for dashboard
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('web-vitals-data', { detail: metric }))
    }

    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vitals:', metric)
      return
    }

    // Send to analytics API
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    })
  } catch (error) {
    console.error('Failed to send Web Vitals data:', error)
  }
}

/**
 * Handle web vitals metric reporting
 */
function onPerfEntry(metric: Metric): void {
  const webVitalsData: WebVitalsData = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: getPerformanceRating(metric.name, metric.value),
    delta: metric.delta,
    entries: metric.entries as PerformanceEntry[],
    url: window.location.href,
    timestamp: Date.now()
  }

  sendToAnalytics(webVitalsData)
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(): void {
  try {
    // Core Web Vitals
    onCLS(onPerfEntry)
    onINP(onPerfEntry)
    onLCP(onPerfEntry)
    
    // Additional metrics
    onFCP(onPerfEntry)
    onTTFB(onPerfEntry)
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error)
  }
}

/**
 * Report custom performance marks
 */
export function reportCustomMetric(name: string, value: number): void {
  const customMetric: WebVitalsData = {
    id: `${name}-${Date.now()}`,
    name: `custom-${name}`,
    value,
    rating: 'good', // Custom metrics don't have standard ratings
    delta: 0,
    entries: [],
    url: window.location.href,
    timestamp: Date.now()
  }

  sendToAnalytics(customMetric)
}

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Mark the start of an operation
   */
  markStart(name: string): void {
    performance.mark(`${name}-start`)
  },

  /**
   * Mark the end of an operation and report duration
   */
  markEnd(name: string): void {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const entries = performance.getEntriesByName(name, 'measure')
    if (entries.length > 0) {
      const duration = entries[entries.length - 1].duration
      reportCustomMetric(name, duration)
    }
  },

  /**
   * Time a function execution
   */
  async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.markStart(name)
    try {
      const result = await fn()
      this.markEnd(name)
      return result
    } catch (error) {
      this.markEnd(name)
      throw error
    }
  }
}