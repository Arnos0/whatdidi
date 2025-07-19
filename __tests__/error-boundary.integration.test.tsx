import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../components/ui/error-boundary'

// Mock error tracking
jest.mock('../lib/utils/error-tracking', () => ({
  errorTracker: {
    captureError: jest.fn(() => 'mock-error-id'),
  },
}))

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}

describe('ErrorBoundary Integration', () => {
  beforeEach(() => {
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('should render error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Report Issue')).toBeInTheDocument()
  })

  it('should show error details in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should reset error boundary when Try Again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'))

    // Wait for timeout and rerender with non-throwing component
    setTimeout(() => {
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
      expect(screen.getByText('Normal content')).toBeInTheDocument()
    }, 200)
  })

  it('should call error tracking when error occurs', () => {
    const { errorTracker } = require('../lib/utils/error-tracking')

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(errorTracker.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'ErrorBoundary',
        action: 'componentDidCatch',
      }),
      'high',
      ['error-boundary', 'react-error']
    )
  })

  it('should display error ID when available', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Error ID: mock-error-id/)).toBeInTheDocument()
  })

  it('should call custom error handler when provided', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should open email client when Report Issue is clicked', () => {
    // Mock window.open
    const mockOpen = jest.fn()
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByText('Report Issue'))

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('mailto:support@whatdidishop.com'),
      '_blank'
    )
  })
})

describe('PageErrorBoundary', () => {
  it('should render page-specific error UI', () => {
    const { PageErrorBoundary } = require('../components/ui/error-boundary')

    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    )

    expect(screen.getByText('Page Error')).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
  })
})

describe('ComponentErrorBoundary', () => {
  it('should render component-specific error UI', () => {
    const { ComponentErrorBoundary } = require('../components/ui/error-boundary')

    render(
      <ComponentErrorBoundary name="TestComponent">
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('TestComponent failed to load')).toBeInTheDocument()
  })

  it('should render generic message when no name provided', () => {
    const { ComponentErrorBoundary } = require('../components/ui/error-boundary')

    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('Component failed to load')).toBeInTheDocument()
  })
})