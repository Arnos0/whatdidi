'use client'

export interface ErrorContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  timestamp: number
  component?: string
  action?: string
  additionalData?: Record<string, any>
}

export interface ErrorReport {
  id: string
  error: {
    name: string
    message: string
    stack?: string
  }
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
}

class ErrorTracker {
  private reports: ErrorReport[] = []
  private maxReports = 100
  private sessionId: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupGlobalErrorHandlers()
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        component: 'global',
        action: 'unhandledrejection',
        additionalData: { 
          promise: event.promise?.toString(),
          reason: event.reason?.toString() 
        }
      }, 'high')
    })

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'global',
        action: 'javascript-error',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }, 'high')
    })
  }

  captureError(
    error: Error | string, 
    context: Partial<ErrorContext> = {},
    severity: ErrorReport['severity'] = 'medium',
    tags: string[] = []
  ): string {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    
    const report: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack
      },
      context: {
        userId: this.getUserId(),
        sessionId: this.sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: Date.now(),
        ...context
      },
      severity,
      tags: [...tags, severity]
    }

    this.addReport(report)
    this.logToConsole(report)
    
    // In production, you would send to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(report)
    }

    return report.id
  }

  private getUserId(): string | undefined {
    // In a real app, this would get the user ID from your auth system
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || undefined
    }
    return undefined
  }

  private addReport(report: ErrorReport) {
    this.reports.unshift(report)
    
    // Keep only the most recent reports
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(0, this.maxReports)
    }

    // Store in localStorage for persistence across sessions
    this.persistReports()
  }

  private persistReports() {
    if (typeof window === 'undefined') return
    
    try {
      const recentReports = this.reports.slice(0, 10) // Only store recent reports
      localStorage.setItem('error-reports', JSON.stringify(recentReports))
    } catch (e) {
      console.warn('Failed to persist error reports:', e)
    }
  }

  private loadPersistedReports() {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('error-reports')
      if (stored) {
        const reports = JSON.parse(stored) as ErrorReport[]
        this.reports = [...reports, ...this.reports]
      }
    } catch (e) {
      console.warn('Failed to load persisted error reports:', e)
    }
  }

  private logToConsole(report: ErrorReport) {
    const logMethods = {
      low: console.log,
      medium: console.warn,
      high: console.error,
      critical: console.error
    }

    const logMethod = logMethods[report.severity]
    logMethod('Error Report:', {
      id: report.id,
      error: report.error,
      context: report.context,
      severity: report.severity,
      tags: report.tags
    })
  }

  private async sendToErrorService(report: ErrorReport) {
    try {
      // This would integrate with services like Sentry, Bugsnag, etc.
      // For now, we'll just log the intent
      console.log('Would send to error service:', report.id)
      
      // Example integration:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // })
    } catch (e) {
      console.error('Failed to send error report:', e)
    }
  }

  getReports(filters?: {
    severity?: ErrorReport['severity']
    component?: string
    since?: number
  }): ErrorReport[] {
    let filteredReports = this.reports

    if (filters?.severity) {
      filteredReports = filteredReports.filter(r => r.severity === filters.severity)
    }

    if (filters?.component) {
      filteredReports = filteredReports.filter(r => r.context.component === filters.component)
    }

    if (filters?.since) {
      filteredReports = filteredReports.filter(r => r.context.timestamp >= filters.since!)
    }

    return filteredReports
  }

  getErrorStats(): {
    total: number
    bySeverity: Record<string, number>
    byComponent: Record<string, number>
    recent: number // Last hour
  } {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    
    return {
      total: this.reports.length,
      bySeverity: this.reports.reduce((acc, report) => {
        acc[report.severity] = (acc[report.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byComponent: this.reports.reduce((acc, report) => {
        const component = report.context.component || 'unknown'
        acc[component] = (acc[component] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recent: this.reports.filter(r => r.context.timestamp >= oneHourAgo).length
    }
  }

  clearReports() {
    this.reports = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error-reports')
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker()

// Hook for React components
export const useErrorTracking = () => {
  const captureError = (
    error: Error | string,
    context?: Partial<ErrorContext>,
    severity?: ErrorReport['severity'],
    tags?: string[]
  ) => {
    return errorTracker.captureError(error, context, severity, tags)
  }

  const captureComponentError = (
    error: Error | string,
    componentName: string,
    action?: string,
    additionalData?: Record<string, any>
  ) => {
    return errorTracker.captureError(error, {
      component: componentName,
      action,
      additionalData
    }, 'medium', ['component-error'])
  }

  return {
    captureError,
    captureComponentError,
    getReports: errorTracker.getReports.bind(errorTracker),
    getErrorStats: errorTracker.getErrorStats.bind(errorTracker),
    clearReports: errorTracker.clearReports.bind(errorTracker)
  }
}