import { 
  AppError, 
  ValidationError, 
  NetworkError, 
  BusinessError, 
  handleApiError,
  isRetryableError,
  getErrorUserMessage,
  ErrorCodes 
} from '../lib/utils/error-standardizer'

describe('AppError', () => {
  it('should create an AppError with default values', () => {
    const error = new AppError('TEST_ERROR', 'Test message')
    
    expect(error.code).toBe('TEST_ERROR')
    expect(error.message).toBe('Test message')
    expect(error.severity).toBe('medium')
    expect(error.category).toBe('system')
    expect(error.retryable).toBe(false)
    expect(error.timestamp).toBeDefined()
    expect(error.userMessage).toBeDefined()
  })

  it('should create an AppError with custom options', () => {
    const error = new AppError('CUSTOM_ERROR', 'Custom message', {
      severity: 'high',
      category: 'user',
      retryable: true,
      userMessage: 'Custom user message',
      details: { field: 'test' }
    })
    
    expect(error.severity).toBe('high')
    expect(error.category).toBe('user')
    expect(error.retryable).toBe(true)
    expect(error.userMessage).toBe('Custom user message')
    expect(error.details).toEqual({ field: 'test' })
  })

  it('should convert to StandardError format', () => {
    const error = new AppError('TEST_ERROR', 'Test message')
    const standardError = error.toStandardError()
    
    expect(standardError).toMatchObject({
      code: 'TEST_ERROR',
      message: 'Test message',
      severity: 'medium',
      category: 'system',
      retryable: false,
      userMessage: expect.any(String),
      timestamp: expect.any(Number)
    })
  })

  it('should create from existing Error', () => {
    const originalError = new Error('Original error')
    const appError = AppError.fromError(originalError, 'CONVERTED_ERROR')
    
    expect(appError.code).toBe('CONVERTED_ERROR')
    expect(appError.message).toBe('Original error')
    expect(appError).toBeInstanceOf(AppError)
  })

  it('should handle ValidationError conversion', () => {
    const validationError = new Error('Validation failed')
    validationError.name = 'ValidationError'
    
    const appError = AppError.fromError(validationError)
    
    expect(appError.category).toBe('validation')
    expect(appError.retryable).toBe(false)
  })
})

describe('ValidationError', () => {
  it('should create ValidationError with proper defaults', () => {
    const error = new ValidationError('Field is required', 'email')
    
    expect(error.code).toBe(ErrorCodes.INVALID_INPUT)
    expect(error.category).toBe('validation')
    expect(error.severity).toBe('medium')
    expect(error.retryable).toBe(false)
    expect(error.details?.field).toBe('email')
    expect(error.userMessage).toContain('email')
  })
})

describe('NetworkError', () => {
  it('should create NetworkError with proper defaults', () => {
    const error = new NetworkError('Connection failed')
    
    expect(error.code).toBe(ErrorCodes.NETWORK_TIMEOUT)
    expect(error.category).toBe('network')
    expect(error.severity).toBe('high')
    expect(error.retryable).toBe(true)
    expect(error.userMessage).toContain('connection')
  })

  it('should allow non-retryable network errors', () => {
    const error = new NetworkError('Connection failed', false)
    
    expect(error.retryable).toBe(false)
  })
})

describe('BusinessError', () => {
  it('should create BusinessError with custom user message', () => {
    const error = new BusinessError('ORDER_NOT_FOUND', 'Order not found', 'The order you requested does not exist')
    
    expect(error.code).toBe('ORDER_NOT_FOUND')
    expect(error.category).toBe('business')
    expect(error.retryable).toBe(false)
    expect(error.userMessage).toBe('The order you requested does not exist')
  })
})

describe('handleApiError', () => {
  it('should return AppError unchanged', () => {
    const originalError = new AppError('TEST_ERROR', 'Test message')
    const result = handleApiError(originalError)
    
    expect(result).toBe(originalError)
  })

  it('should handle fetch errors', () => {
    const fetchError = new TypeError('Failed to fetch')
    const result = handleApiError(fetchError)
    
    // Since NetworkError extends AppError, the instanceof check might not work as expected
    // Let's check the properties instead
    expect(result).toBeInstanceOf(AppError)
    expect(result.category).toBe('network')
    expect(result.code).toBe(ErrorCodes.NETWORK_TIMEOUT)
    expect(result.severity).toBe('high')
  })

  it('should handle 401 errors', () => {
    const authError = new Error('401 Unauthorized')
    const result = handleApiError(authError)
    
    expect(result.code).toBe(ErrorCodes.AUTHENTICATION_ERROR)
    expect(result.userMessage).toContain('log in')
  })

  it('should handle 403 errors', () => {
    const authzError = new Error('403 Forbidden')
    const result = handleApiError(authzError)
    
    expect(result.code).toBe(ErrorCodes.AUTHORIZATION_ERROR)
    expect(result.userMessage).toContain('permission')
  })

  it('should handle 429 errors', () => {
    const rateLimitError = new Error('429 Too Many Requests')
    const result = handleApiError(rateLimitError)
    
    expect(result.code).toBe(ErrorCodes.RATE_LIMITED)
    expect(result.userMessage).toContain('quickly')
  })

  it('should handle string errors', () => {
    const result = handleApiError('Something went wrong')
    
    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('Something went wrong')
  })

  it('should handle unknown error types', () => {
    const result = handleApiError({ unknown: 'error' })
    
    expect(result).toBeInstanceOf(AppError)
    expect(result.code).toBe('UNKNOWN_ERROR')
  })
})

describe('isRetryableError', () => {
  it('should return retryable status for AppError', () => {
    const retryableError = new NetworkError('Connection failed')
    const nonRetryableError = new ValidationError('Invalid input')
    
    expect(isRetryableError(retryableError)).toBe(true)
    expect(isRetryableError(nonRetryableError)).toBe(false)
  })

  it('should detect retryable patterns in regular errors', () => {
    const networkError = new Error('Network timeout')
    const validationError = new Error('Invalid format')
    
    expect(isRetryableError(networkError)).toBe(true)
    expect(isRetryableError(validationError)).toBe(false)
  })

  it('should detect HTTP status patterns', () => {
    const serverError = new Error('502 Bad Gateway')
    const clientError = new Error('400 Bad Request')
    
    expect(isRetryableError(serverError)).toBe(true)
    expect(isRetryableError(clientError)).toBe(false)
  })
})

describe('getErrorUserMessage', () => {
  it('should return userMessage for AppError', () => {
    const error = new AppError('TEST_ERROR', 'Test message', {
      userMessage: 'Custom user message'
    })
    
    expect(getErrorUserMessage(error)).toBe('Custom user message')
  })

  it('should return default message for regular Error', () => {
    const error = new Error('Some error')
    
    expect(getErrorUserMessage(error)).toBe('An unexpected error occurred. Please try again.')
  })
})