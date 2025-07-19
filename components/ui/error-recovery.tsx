'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RefreshCw, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNetworkState } from '@/hooks/use-network-state'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useErrorTracking } from '@/lib/utils/error-tracking'

interface RecoveryStep {
  id: string
  title: string
  description: string
  action?: () => void
  actionLabel?: string
  completed?: boolean
  optional?: boolean
}

interface ErrorRecoveryProps {
  error: Error | string
  errorType?: 'network' | 'validation' | 'server' | 'unknown'
  context?: string
  onRetry?: () => void
  onReportIssue?: () => void
  customSteps?: RecoveryStep[]
  className?: string
}

export function ErrorRecovery({
  error,
  errorType = 'unknown',
  context,
  onRetry,
  onReportIssue,
  customSteps,
  className = ''
}: ErrorRecoveryProps) {
  const [expandedSteps, setExpandedSteps] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const { isOnline, isSlowConnection } = useNetworkState()
  const prefersReducedMotion = useReducedMotion()
  const { captureComponentError } = useErrorTracking()

  const errorMessage = typeof error === 'string' ? error : error.message

  const getDefaultSteps = (): RecoveryStep[] => {
    const steps: RecoveryStep[] = []

    if (errorType === 'network' || !isOnline) {
      steps.push({
        id: 'check-connection',
        title: 'Check your internet connection',
        description: 'Make sure you are connected to the internet',
        completed: isOnline
      })
    }

    if (isSlowConnection) {
      steps.push({
        id: 'slow-connection',
        title: 'Wait for better connection',
        description: 'Your connection seems slow. Try waiting a moment',
        optional: true
      })
    }

    if (errorType === 'validation') {
      steps.push({
        id: 'check-form',
        title: 'Review form data',
        description: 'Make sure all required fields are filled correctly'
      })
    }

    if (errorType === 'server') {
      steps.push({
        id: 'server-retry',
        title: 'Try again',
        description: 'The server may be temporarily unavailable',
        action: onRetry,
        actionLabel: 'Retry'
      })
    }

    // Common steps for all error types
    steps.push({
      id: 'refresh-page',
      title: 'Refresh the page',
      description: 'A simple page refresh often resolves issues',
      action: () => window.location.reload(),
      actionLabel: 'Refresh'
    })

    steps.push({
      id: 'clear-cache',
      title: 'Clear browser cache',
      description: 'Clear your browser cache and cookies for this site',
      optional: true
    })

    steps.push({
      id: 'try-incognito',
      title: 'Try incognito mode',
      description: 'Test if the issue persists in a private/incognito window',
      optional: true
    })

    return steps
  }

  const recoverySteps = customSteps || getDefaultSteps()

  const handleStepAction = (step: RecoveryStep) => {
    try {
      step.action?.()
      setCompletedSteps(prev => new Set([...Array.from(prev), step.id]))
    } catch (actionError) {
      captureComponentError(
        actionError instanceof Error ? actionError : new Error('Step action failed'),
        'ErrorRecovery',
        'handleStepAction',
        { stepId: step.id, originalError: errorMessage }
      )
    }
  }

  const getErrorIcon = () => {
    if (!isOnline) return <WifiOff className="h-6 w-6 text-destructive" />
    if (errorType === 'validation') return <AlertTriangle className="h-6 w-6 text-warning-600" />
    return <AlertTriangle className="h-6 w-6 text-destructive" />
  }

  const getErrorTitle = () => {
    if (!isOnline) return 'Connection Lost'
    if (errorType === 'network') return 'Network Error'
    if (errorType === 'validation') return 'Validation Error'
    if (errorType === 'server') return 'Server Error'
    return 'Something went wrong'
  }

  const animationProps = prefersReducedMotion ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  return (
    <motion.div className={className} {...animationProps}>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Error Header */}
          <div className="flex items-start gap-4">
            {getErrorIcon()}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{getErrorTitle()}</h3>
              <p className="text-muted-foreground mt-1">{errorMessage}</p>
              {context && (
                <Badge variant="outline" className="mt-2">
                  {context}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            {onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setExpandedSteps(!expandedSteps)}
              className="flex items-center gap-2"
            >
              Recovery Steps
              {expandedSteps ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {onReportIssue && (
              <Button 
                variant="outline" 
                onClick={onReportIssue}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Report Issue
              </Button>
            )}
          </div>

          {/* Recovery Steps */}
          <AnimatePresence>
            {expandedSteps && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 border-t pt-4"
              >
                <h4 className="font-medium">Recovery Steps</h4>
                <div className="space-y-3">
                  {recoverySteps.map((step, index) => {
                    const isCompleted = completedSteps.has(step.id) || step.completed
                    
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          isCompleted 
                            ? 'bg-success-50 border-success-200' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-success-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                              <span className="text-xs font-medium">{index + 1}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{step.title}</h5>
                            {step.optional && (
                              <Badge variant="secondary" className="text-xs">
                                Optional
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>

                        {step.action && !isCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStepAction(step)}
                            className="flex items-center gap-1"
                          >
                            {step.actionLabel || 'Do this'}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Additional Help */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Still having issues?</strong> Contact our support team with the error details above.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      const subject = `Error Report: ${getErrorTitle()}`
                      const body = `Error: ${errorMessage}\nContext: ${context || 'N/A'}\nURL: ${window.location.href}`
                      window.open(`mailto:support@whatdidishop.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Contact Support
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}