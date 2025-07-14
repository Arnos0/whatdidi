'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard Error Boundary caught an error:', error, errorInfo)
    }
    
    // In production, you might want to log to an error reporting service
    // Example: errorReportingService.logError(error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      // Render custom fallback UI or provided fallback
      return this.props.fallback || (
        <Card className="p-6 m-4">
          <div className="flex items-center space-x-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                An error occurred while loading this section. Please refresh the page.
              </p>
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}