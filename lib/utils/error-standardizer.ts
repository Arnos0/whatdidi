/**
 * Error standardization utilities for consistent error handling across the application
 */

export interface StandardError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'user' | 'system' | 'network' | 'validation' | 'business'
  retryable: boolean
  userMessage: string
}

export class AppError extends Error {
  public readonly code: string
  public readonly severity: StandardError['severity']
  public readonly category: StandardError['category']
  public readonly retryable: boolean
  public readonly userMessage: string
  public readonly details?: Record<string, any>
  public readonly timestamp: number

  constructor(
    code: string,
    message: string,
    options: {
      severity?: StandardError['severity']
      category?: StandardError['category']
      retryable?: boolean
      userMessage?: string
      details?: Record<string, any>
      cause?: Error
    } = {}
  ) {
    super(message, { cause: options.cause })
    
    this.name = 'AppError'
    this.code = code
    this.severity = options.severity || 'medium'
    this.category = options.category || 'system'
    this.retryable = options.retryable || false
    this.userMessage = options.userMessage || this.getDefaultUserMessage()
    this.details = options.details
    this.timestamp = Date.now()

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype)
  }

  private getDefaultUserMessage(): string {
    const messages = {
      user: 'There was an issue with your request. Please check your input and try again.',
      system: 'We encountered a technical issue. Please try again in a moment.',
      network: 'We\'re having trouble connecting. Please check your internet connection.',
      validation: 'Please check your input and ensure all required fields are complete.',
      business: 'This action cannot be completed due to business rules.'
    }
    
    return messages[this.category] || 'An unexpected error occurred. Please try again.'
  }

  toStandardError(): StandardError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      severity: this.severity,
      category: this.category,
      retryable: this.retryable,
      userMessage: this.userMessage
    }
  }

  static fromError(error: Error, code?: string): AppError {
    if (error instanceof AppError) {
      return error
    }

    // Handle common error types
    if (error.name === 'ValidationError') {
      return new AppError(
        code || 'VALIDATION_ERROR',
        error.message,
        {
          category: 'validation',
          severity: 'medium',
          retryable: false,
          userMessage: 'Please check your input and try again.'
        }
      )
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new AppError(
        code || 'NETWORK_ERROR',
        error.message,
        {
          category: 'network',
          severity: 'high',
          retryable: true,
          userMessage: 'We\'re having trouble connecting. Please try again.'
        }
      )
    }

    // Default to system error
    return new AppError(
      code || 'UNKNOWN_ERROR',
      error.message,
      {
        category: 'system',
        severity: 'medium',
        retryable: true,
        cause: error
      }
    )
  }
}

// Predefined error codes and factories
export const ErrorCodes = {
  // User errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_ORDER_NUMBER: 'INVALID_ORDER_NUMBER',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  API_ERROR: 'API_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  
  // Network errors
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  CONNECTION_LOST: 'CONNECTION_LOST',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Business errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  DUPLICATE_ORDER: 'DUPLICATE_ORDER',
  INVALID_ORDER_STATUS: 'INVALID_ORDER_STATUS'
} as const

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(ErrorCodes.INVALID_INPUT, message, {
      category: 'validation',
      severity: 'medium',
      retryable: false,
      details: { field },
      userMessage: `Please check the ${field || 'input'} and try again.`
    })
  }
}

export class NetworkError extends AppError {
  constructor(message: string, retryable = true) {
    super(ErrorCodes.NETWORK_TIMEOUT, message, {
      category: 'network',
      severity: 'high',
      retryable,
      userMessage: 'We\'re having trouble connecting. Please check your internet connection and try again.'
    })
  }
}

export class BusinessError extends AppError {
  constructor(code: string, message: string, userMessage?: string) {
    super(code, message, {
      category: 'business',
      severity: 'medium',
      retryable: false,
      userMessage: userMessage || 'This action cannot be completed due to business rules.'
    })
  }
}

// Error handling utilities
export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Handle fetch errors
    if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
      return new NetworkError(error.message)
    }

    // Handle API response errors
    if (error.message.includes('401')) {
      return new AppError(ErrorCodes.AUTHENTICATION_ERROR, 'Authentication failed', {
        category: 'user',
        severity: 'high',
        retryable: false,
        userMessage: 'Please log in again.'
      })
    }

    if (error.message.includes('403')) {
      return new AppError(ErrorCodes.AUTHORIZATION_ERROR, 'Access denied', {
        category: 'user',
        severity: 'high',
        retryable: false,
        userMessage: 'You don\'t have permission to perform this action.'
      })
    }

    if (error.message.includes('429')) {
      return new AppError(ErrorCodes.RATE_LIMITED, 'Too many requests', {
        category: 'system',
        severity: 'medium',
        retryable: true,
        userMessage: 'You\'re doing that too quickly. Please wait a moment and try again.'
      })
    }

    return AppError.fromError(error)
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppError('UNKNOWN_ERROR', error, {
      category: 'system',
      severity: 'medium'
    })
  }

  // Handle unknown error types
  return new AppError('UNKNOWN_ERROR', 'An unexpected error occurred', {
    category: 'system',
    severity: 'medium',
    details: { originalError: error }
  })
}

export function isRetryableError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return error.retryable
  }

  // Check for common retryable error patterns
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /502|503|504/,
    /rate limit/i
  ]

  return retryablePatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  )
}

export function getErrorUserMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.userMessage
  }

  return 'An unexpected error occurred. Please try again.'
}