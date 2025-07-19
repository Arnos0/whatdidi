'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Bug, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  TestTube,
  PlayCircle,
  StopCircle,
  Settings
} from 'lucide-react'
import { useErrorTracking } from '@/lib/utils/error-tracking'
import { AppError, ValidationError, NetworkError, BusinessError } from '@/lib/utils/error-standardizer'
import { toast } from 'sonner'

export function TestingPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [customErrorMessage, setCustomErrorMessage] = useState('Test error message')
  const [isClient, setIsClient] = useState(false)
  const { captureError, captureComponentError, getErrorStats } = useErrorTracking()

  // Prevent hydration mismatch by only showing after client mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only show in development and after client mount
  if (!isClient || process.env.NODE_ENV !== 'development') {
    return null
  }

  const triggerError = (type: string) => {
    switch (type) {
      case 'component':
        throw new Error('Test component error')
      
      case 'validation':
        const validationError = new ValidationError('Test validation error', 'testField')
        captureError(validationError, { component: 'TestingPanel', action: 'triggerValidationError' })
        toast.error(validationError.userMessage)
        break
      
      case 'network':
        const networkError = new NetworkError('Test network error')
        captureError(networkError, { component: 'TestingPanel', action: 'triggerNetworkError' })
        toast.error(networkError.userMessage)
        break
      
      case 'business':
        const businessError = new BusinessError('ORDER_NOT_FOUND', 'Test business logic error', 'The order you requested could not be found.')
        captureError(businessError, { component: 'TestingPanel', action: 'triggerBusinessError' })
        toast.error(businessError.userMessage)
        break
      
      case 'async':
        Promise.reject(new Error('Test async error')).catch(error => {
          captureComponentError(error, 'TestingPanel', 'asyncError')
          toast.error('Async operation failed')
        })
        break
      
      case 'custom':
        const customError = new AppError('CUSTOM_TEST_ERROR', customErrorMessage, {
          severity: 'medium',
          category: 'system',
          retryable: true
        })
        captureError(customError, { component: 'TestingPanel', action: 'customError' })
        toast.error(customError.userMessage)
        break
    }
  }

  const simulateNetworkConditions = (condition: string) => {
    switch (condition) {
      case 'offline':
        toast.info('Simulating offline mode (use DevTools Network tab to actually go offline)')
        break
      case 'slow':
        toast.info('Simulating slow connection (use DevTools Network throttling)')
        break
      case 'timeout':
        // Simulate a timeout by making a request to a non-existent endpoint
        fetch('/api/timeout-test', { signal: AbortSignal.timeout(1000) })
          .catch(error => {
            const timeoutError = new NetworkError('Request timeout', true)
            captureError(timeoutError, { component: 'TestingPanel', action: 'timeoutTest' })
            toast.error('Request timed out')
          })
        break
    }
  }

  const testFormValidation = (scenario: string) => {
    const errors = {
      'empty-required': 'Email is required',
      'invalid-email': 'Please enter a valid email address',
      'weak-password': 'Password must be at least 8 characters',
      'invalid-order': 'Order number format is invalid'
    }
    
    const validationError = new ValidationError(errors[scenario as keyof typeof errors] || 'Validation failed')
    captureError(validationError, { component: 'TestingPanel', action: 'testFormValidation', scenario })
    toast.error(validationError.userMessage)
  }

  const clearAllErrors = () => {
    window.location.reload()
  }

  const stats = getErrorStats()

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full w-12 h-12 p-0 bg-purple-600 hover:bg-purple-700"
          title="Open Testing Panel"
        >
          <TestTube className="h-5 w-5" />
        </Button>
      ) : (
        <Card className="w-80 max-h-96 overflow-y-auto p-4 bg-white border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Testing Panel</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </div>

          {/* Error Stats */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Error Stats</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Total: <Badge variant="outline">{stats.total}</Badge></div>
              <div>Recent: <Badge variant="outline">{stats.recent}</Badge></div>
            </div>
          </div>

          {/* Error Testing */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Bug className="h-4 w-4" />
                Error Testing
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => triggerError('component')}>
                  Component Error
                </Button>
                <Button size="sm" variant="outline" onClick={() => triggerError('validation')}>
                  Validation Error
                </Button>
                <Button size="sm" variant="outline" onClick={() => triggerError('network')}>
                  Network Error
                </Button>
                <Button size="sm" variant="outline" onClick={() => triggerError('business')}>
                  Business Error
                </Button>
                <Button size="sm" variant="outline" onClick={() => triggerError('async')}>
                  Async Error
                </Button>
                <Button size="sm" variant="outline" onClick={() => triggerError('custom')}>
                  Custom Error
                </Button>
              </div>
            </div>

            {/* Custom Error Message */}
            <div>
              <Label htmlFor="customError" className="text-xs">Custom Error Message:</Label>
              <Input
                id="customError"
                value={customErrorMessage}
                onChange={(e) => setCustomErrorMessage(e.target.value)}
                className="text-xs h-8"
                placeholder="Enter custom error message"
              />
            </div>

            {/* Network Testing */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Wifi className="h-4 w-4" />
                Network Testing
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => simulateNetworkConditions('offline')}>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Button>
                <Button size="sm" variant="outline" onClick={() => simulateNetworkConditions('slow')}>
                  Slow
                </Button>
                <Button size="sm" variant="outline" onClick={() => simulateNetworkConditions('timeout')}>
                  Timeout
                </Button>
              </div>
            </div>

            {/* Form Validation Testing */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Form Validation
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => testFormValidation('empty-required')}>
                  Empty Required
                </Button>
                <Button size="sm" variant="outline" onClick={() => testFormValidation('invalid-email')}>
                  Invalid Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => testFormValidation('weak-password')}>
                  Weak Password
                </Button>
                <Button size="sm" variant="outline" onClick={() => testFormValidation('invalid-order')}>
                  Invalid Order
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t">
              <Button size="sm" variant="destructive" onClick={clearAllErrors} className="w-full">
                <StopCircle className="h-3 w-3 mr-1" />
                Clear & Reload
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}