'use client'

import { useState, useEffect } from 'react'
import { Card, GlassCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Activity, Clock, Zap, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { WebVitalsData } from '@/lib/analytics/web-vitals'

interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
}

interface WebVitalsDashboardProps {
  className?: string
}

export function WebVitalsDashboard({ className }: WebVitalsDashboardProps) {
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>([])
  const [isCollecting, setIsCollecting] = useState(false)

  useEffect(() => {
    // Load stored metrics from localStorage
    const stored = localStorage.getItem('web-vitals-metrics')
    if (stored) {
      try {
        setMetrics(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse stored Web Vitals data:', error)
      }
    }

    // Listen for new Web Vitals data
    const handleWebVitalsData = (event: CustomEvent<WebVitalsData>) => {
      const newMetric: WebVitalsMetric = {
        name: event.detail.name,
        value: event.detail.value,
        rating: event.detail.rating,
        timestamp: event.detail.timestamp,
        url: event.detail.url
      }

      setMetrics(prev => {
        const updated = [...prev, newMetric]
        // Keep only last 50 metrics
        const trimmed = updated.slice(-50)
        localStorage.setItem('web-vitals-metrics', JSON.stringify(trimmed))
        return trimmed
      })
    }

    window.addEventListener('web-vitals-data', handleWebVitalsData as EventListener)

    return () => {
      window.removeEventListener('web-vitals-data', handleWebVitalsData as EventListener)
    }
  }, [])

  const getMetricIcon = (name: string) => {
    switch (name) {
      case 'CLS':
        return <Activity className="w-4 h-4" />
      case 'INP':
        return <Zap className="w-4 h-4" />
      case 'FCP':
        return <Eye className="w-4 h-4" />
      case 'LCP':
        return <TrendingUp className="w-4 h-4" />
      case 'TTFB':
        return <Clock className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-success-600 bg-success-50'
      case 'needs-improvement':
        return 'text-warning-600 bg-warning-50'
      case 'poor':
        return 'text-destructive bg-destructive/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const formatValue = (name: string, value: number) => {
    switch (name) {
      case 'CLS':
        return value.toFixed(3)
      case 'INP':
      case 'FCP':
      case 'LCP':
      case 'TTFB':
        return `${Math.round(value)}ms`
      default:
        return value.toString()
    }
  }

  const getLatestMetrics = () => {
    const latest = new Map<string, WebVitalsMetric>()
    
    metrics.forEach(metric => {
      const existing = latest.get(metric.name)
      if (!existing || metric.timestamp > existing.timestamp) {
        latest.set(metric.name, metric)
      }
    })

    return Array.from(latest.values()).sort((a, b) => a.name.localeCompare(b.name))
  }

  const getAverageRating = () => {
    const latest = getLatestMetrics()
    if (latest.length === 0) return 'good'

    const ratings = latest.map(m => m.rating)
    const poorCount = ratings.filter(r => r === 'poor').length
    const needsImprovementCount = ratings.filter(r => r === 'needs-improvement').length

    if (poorCount > 0) return 'poor'
    if (needsImprovementCount > 0) return 'needs-improvement'
    return 'good'
  }

  const clearMetrics = () => {
    setMetrics([])
    localStorage.removeItem('web-vitals-metrics')
  }

  const collectMetrics = () => {
    setIsCollecting(true)
    // Trigger a performance measurement
    performance.mark('manual-collection-start')
    
    setTimeout(() => {
      setIsCollecting(false)
      performance.mark('manual-collection-end')
    }, 2000)
  }

  const latestMetrics = getLatestMetrics()
  const overallRating = getAverageRating()

  return (
    <div className={className}>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Core Web Vitals</h3>
            <p className="text-sm text-muted-foreground">
              Real-time performance monitoring
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={overallRating === 'good' ? 'default' : 'destructive'}
              className={getMetricColor(overallRating)}
            >
              {overallRating === 'good' ? 'Good' : 
               overallRating === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
            </Badge>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={collectMetrics}
                disabled={isCollecting}
              >
                {isCollecting ? 'Collecting...' : 'Collect'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearMetrics}
                disabled={metrics.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {latestMetrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card variant="interactive" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(metric.name)}
                      <span className="font-medium text-sm">{metric.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getMetricColor(metric.rating)}`}
                    >
                      {metric.rating.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="text-2xl font-bold mb-1">
                    {formatValue(metric.name, metric.value)}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No Web Vitals data collected yet. Navigate around the app to start collecting metrics.
            </p>
          </div>
        )}

        {metrics.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              <strong>{metrics.length}</strong> metrics collected across{' '}
              <strong>{new Set(metrics.map(m => m.url)).size}</strong> pages
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

/**
 * Metric descriptions for reference
 */
export const WEB_VITALS_INFO = {
  CLS: {
    name: 'Cumulative Layout Shift',
    description: 'Measures visual stability to avoid unexpected layout shifts',
    thresholds: { good: 0.1, poor: 0.25 }
  },
  INP: {
    name: 'Interaction to Next Paint',
    description: 'Measures responsiveness to user interactions',
    thresholds: { good: 200, poor: 500 }
  },
  FCP: {
    name: 'First Contentful Paint',
    description: 'Time until first content appears on screen',
    thresholds: { good: 1800, poor: 3000 }
  },
  LCP: {
    name: 'Largest Contentful Paint',
    description: 'Time until the largest content element appears',
    thresholds: { good: 2500, poor: 4000 }
  },
  TTFB: {
    name: 'Time to First Byte',
    description: 'Time until the first byte of response is received',
    thresholds: { good: 800, poor: 1800 }
  }
}