'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface FormErrorProps {
  error?: string
  fieldName?: string
  suggestions?: string[]
  className?: string
  showIcon?: boolean
  variant?: 'inline' | 'card' | 'tooltip'
}

export function FormError({ 
  error, 
  fieldName, 
  suggestions = [], 
  className = '',
  showIcon = true,
  variant = 'inline'
}: FormErrorProps) {
  const prefersReducedMotion = useReducedMotion()
  
  if (!error) return null

  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: -10, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.95 },
        transition: { duration: 0.2 }
      }

  const baseClasses = {
    inline: 'flex items-start gap-2 text-sm text-destructive mt-1',
    card: 'p-3 bg-destructive/5 border border-destructive/20 rounded-lg',
    tooltip: 'absolute z-10 p-2 bg-destructive text-destructive-foreground text-xs rounded shadow-lg'
  }

  return (
    <AnimatePresence>
      <motion.div 
        className={cn(baseClasses[variant], className)}
        {...animationProps}
      >
        {showIcon && (
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="font-medium">{error}</p>
          {suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium opacity-80">Suggestions:</p>
              <ul className="text-xs space-y-1 ml-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-xs">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  suggestions?: string[]
  helpText?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  htmlFor,
  required, 
  error, 
  suggestions,
  helpText,
  children, 
  className = '' 
}: FormFieldProps) {
  const prefersReducedMotion = useReducedMotion()
  
  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 }
      }

  return (
    <motion.div className={cn('space-y-2', className)} {...animationProps}>
      <div className="flex items-center gap-2">
        <label 
          htmlFor={htmlFor}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error && 'text-destructive'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {helpText && (
          <div className="group relative">
            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            <div className="absolute bottom-6 left-0 invisible group-hover:visible bg-popover text-popover-foreground p-2 rounded border shadow-md text-xs max-w-xs z-10">
              {helpText}
            </div>
          </div>
        )}
      </div>
      
      <div className={cn(error && 'ring-1 ring-destructive rounded-md')}>
        {children}
      </div>
      
      <FormError 
        error={error} 
        suggestions={suggestions}
        variant="inline"
      />
    </motion.div>
  )
}

interface FormValidationSummaryProps {
  errors: Record<string, string>
  className?: string
  onDismiss?: () => void
  title?: string
}

export function FormValidationSummary({ 
  errors, 
  className = '',
  onDismiss,
  title = 'Please fix the following errors:'
}: FormValidationSummaryProps) {
  const errorCount = Object.keys(errors).length
  const prefersReducedMotion = useReducedMotion()

  if (errorCount === 0) return null

  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3 }
      }

  return (
    <AnimatePresence>
      <motion.div {...animationProps}>
        <Card className={cn('p-4 bg-destructive/5 border-destructive/20', className)}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive mb-2">{title}</h4>
                <ul className="space-y-1 text-sm text-destructive/80">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="flex items-start gap-1">
                      <span className="text-xs mt-1">•</span>
                      <span><strong>{field}:</strong> {error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

interface FormSuccessProps {
  message: string
  className?: string
  onDismiss?: () => void
}

export function FormSuccess({ 
  message, 
  className = '',
  onDismiss 
}: FormSuccessProps) {
  const prefersReducedMotion = useReducedMotion()

  const animationProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.3 }
      }

  return (
    <AnimatePresence>
      <motion.div {...animationProps}>
        <Card className={cn('p-4 bg-success-50 border-success-200', className)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <p className="text-sm font-medium text-success-800">{message}</p>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="h-8 w-8 text-success-600 hover:text-success-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}