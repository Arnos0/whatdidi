'use client'

import { AppError, ValidationError, NetworkError, BusinessError } from './error-standardizer'

/**
 * URL-based error triggers for easy testing
 * Add ?test=error-type to any URL to trigger errors
 * Examples:
 * - ?test=component-error
 * - ?test=validation-error
 * - ?test=network-error
 * - ?test=form-validation
 */

export function initializeTestTriggers() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return
  }

  const urlParams = new URLSearchParams(window.location.search)
  const testType = urlParams.get('test')

  if (!testType) return

  console.log(`🧪 Test trigger activated: ${testType}`)

  switch (testType) {
    case 'component-error':
      setTimeout(() => {
        throw new Error('Test component error triggered via URL')
      }, 1000)
      break

    case 'validation-error':
      setTimeout(() => {
        const error = new ValidationError('Test validation error from URL', 'testField')
        window.dispatchEvent(new CustomEvent('test-error', { detail: error }))
      }, 1000)
      break

    case 'network-error':
      setTimeout(() => {
        const error = new NetworkError('Test network error from URL')
        window.dispatchEvent(new CustomEvent('test-error', { detail: error }))
      }, 1000)
      break

    case 'business-error':
      setTimeout(() => {
        const error = new BusinessError('TEST_BUSINESS_ERROR', 'Test business error from URL')
        window.dispatchEvent(new CustomEvent('test-error', { detail: error }))
      }, 1000)
      break

    case 'async-error':
      setTimeout(() => {
        Promise.reject(new Error('Test async error from URL'))
          .catch(error => {
            window.dispatchEvent(new CustomEvent('test-error', { detail: error }))
          })
      }, 1000)
      break

    case 'form-validation':
      // Trigger form validation errors in forms
      setTimeout(() => {
        const forms = document.querySelectorAll('form')
        forms.forEach(form => {
          const inputs = form.querySelectorAll('input[required]')
          inputs.forEach(input => {
            if (input instanceof HTMLInputElement) {
              input.setCustomValidity('Test validation error')
              input.reportValidity()
            }
          })
        })
      }, 1000)
      break

    case 'slow-loading':
      // Add artificial delays to test loading states
      const originalFetch = window.fetch
      window.fetch = function(...args) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(originalFetch.apply(this, args))
          }, 3000)
        })
      }
      console.log('🐌 Slow loading mode activated (3s delay on all requests)')
      break

    case 'offline-mode':
      // Override navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: false
      })
      window.dispatchEvent(new Event('offline'))
      console.log('📡 Offline mode simulated')
      break

    case 'memory-pressure':
      // Create memory pressure for testing
      const memoryHog: any[] = []
      const interval = setInterval(() => {
        // Create large objects to trigger memory pressure
        for (let i = 0; i < 1000; i++) {
          memoryHog.push(new Array(10000).fill('memory-test'))
        }
        if (memoryHog.length > 50000) {
          clearInterval(interval)
          console.log('🧠 Memory pressure test completed')
        }
      }, 100)
      break

    default:
      console.warn(`Unknown test type: ${testType}`)
  }
}

/**
 * Manual test helpers for console usage
 */
export const testHelpers = {
  triggerComponentError: () => {
    throw new Error('Manual component error')
  },

  triggerValidationError: (field = 'testField') => {
    const error = new ValidationError('Manual validation error', field)
    window.dispatchEvent(new CustomEvent('test-error', { detail: error }))
    return error
  },

  triggerNetworkError: () => {
    const error = new NetworkError('Manual network error')
    window.dispatchEvent(new CustomEvent('test-error', { detail: error }))
    return error
  },

  simulateSlowConnection: (delay = 3000) => {
    const originalFetch = window.fetch
    window.fetch = function(...args) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(originalFetch.apply(this, args))
        }, delay)
      })
    }
    console.log(`🐌 Slow connection simulated with ${delay}ms delay`)
  },

  restoreFetch: () => {
    // This would need to store the original fetch reference
    window.location.reload()
  },

  fillFormWithInvalidData: () => {
    const inputs = document.querySelectorAll('input')
    inputs.forEach(input => {
      if (input instanceof HTMLInputElement) {
        switch (input.type) {
          case 'email':
            input.value = 'invalid-email'
            break
          case 'number':
            input.value = '-999'
            break
          case 'tel':
            input.value = 'abc123'
            break
          case 'url':
            input.value = 'not-a-url'
            break
          default:
            if (input.required && input.value === '') {
              input.value = '' // Keep empty for required field testing
            }
        }
      }
    })
    console.log('📝 Forms filled with invalid data for testing')
  },

  clearAllForms: () => {
    const forms = document.querySelectorAll('form')
    forms.forEach(form => {
      if (form instanceof HTMLFormElement) {
        form.reset()
      }
    })
    console.log('🧹 All forms cleared')
  }
}

// Make test helpers available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testHelpers = testHelpers
}