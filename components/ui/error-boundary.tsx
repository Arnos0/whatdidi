'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { errorTracker } from '@/lib/utils/error-tracking'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error?: Error
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  public state: State = {
    hasError: false,
    errorId: ''
  }

  public static getDerivedStateFromError(error: Error): State {
    const errorId = Date.now().toString()
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error with our error tracking system
    const errorId = errorTracker.captureError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: {
        componentStack: errorInfo.componentStack
      }
    }, 'high', ['error-boundary', 'react-error'])

    // Store error ID for user feedback
    this.setState({ errorId })
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props
    const { hasError } = this.state
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((resetKey, idx) => 
        prevProps.resetKeys?.[idx] !== resetKey
      )) {
        this.resetErrorBoundary()
      }
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }
    
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorId: ''
      })
    }, 100)
  }

  private sendFeedback = () => {
    const subject = `Error Report: ${this.state.errorId}`
    const body = `I encountered an error while using the application.

Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Time: ${new Date().toLocaleString()}
URL: ${window.location.href}

Additional details:
`
    
    const mailtoLink = `mailto:support@whatdidishop.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
  }

  public render() {
    if (this.state.hasError) {
      // Render custom fallback UI or provided fallback
      return this.props.fallback || (
        <Card className="p-6 m-4">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Something went wrong</h3>
              <p className="text-sm text-muted-foreground mt-2">
                An unexpected error occurred. This error has been logged and we&apos;ll look into it.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-4 bg-muted rounded text-left">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.resetErrorBoundary}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button 
                onClick={() => this.sendFeedback()}
                variant="ghost"
                className="flex items-center gap-2 text-muted-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                Report Issue
              </Button>
            </div>
            {this.state.errorId && (
              <p className="text-xs text-muted-foreground mt-4">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

// Specific error boundaries for different sections
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Page Error</h2>
            <p className="text-muted-foreground mb-4">
              This page encountered an error and couldn&apos;t load properly.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="gradient"
            >
              Reload Page
            </Button>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children, name }: { children: ReactNode; name?: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {name ? `${name} failed to load` : 'Component failed to load'}
            </span>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}