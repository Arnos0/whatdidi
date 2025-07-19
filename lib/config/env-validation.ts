/**
 * Environment variable validation utilities
 * Ensures critical configuration is properly set before application startup
 */

export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates all critical environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const isProduction = process.env.NODE_ENV === 'production'

  // Critical environment variables for production
  const criticalVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ]

  // Security-sensitive variables
  const securityVars = [
    'TOKEN_ENCRYPTION_KEY',
    'N8N_WEBHOOK_TOKEN'
  ]

  // Validate critical variables
  for (const varName of criticalVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`)
    }
  }

  // Validate security variables
  for (const varName of securityVars) {
    const value = process.env[varName]
    if (!value) {
      if (isProduction) {
        errors.push(`Missing security-critical environment variable: ${varName}`)
      } else {
        warnings.push(`Missing security variable: ${varName} (will use development default)`)
      }
    } else if (varName === 'TOKEN_ENCRYPTION_KEY' && value.length < 32) {
      errors.push(`${varName} must be at least 32 characters long for security`)
    }
  }

  // Validate AI service configuration
  const hasGemini = process.env.GEMINI_API_KEY
  const hasOpenAI = process.env.OPENAI_API_KEY
  
  if (!hasGemini && !hasOpenAI) {
    if (isProduction) {
      errors.push('At least one AI service (GEMINI_API_KEY or OPENAI_API_KEY) must be configured')
    } else {
      warnings.push('No AI service configured - some features may not work')
    }
  }

  // Validate OAuth configuration if using email features
  const oauthVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET']
  const hasOAuth = oauthVars.some(varName => process.env[varName])
  
  if (!hasOAuth) {
    warnings.push('No OAuth providers configured - email integration will not work')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates environment and throws on critical errors
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment()
  
  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Warnings:')
    result.warnings.forEach(warning => console.warn(`   - ${warning}`))
  }
  
  // Throw on errors
  if (!result.isValid) {
    console.error('❌ Environment Validation Failed:')
    result.errors.forEach(error => console.error(`   - ${error}`))
    throw new Error(`Environment validation failed: ${result.errors.length} error(s) found`)
  }
  
  if (result.warnings.length === 0 && result.errors.length === 0) {
    console.log('✅ Environment validation passed')
  }
}

/**
 * Get a validated environment variable with type safety
 */
export function getRequiredEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue
  
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  
  return value
}

/**
 * Get an optional environment variable with type safety
 */
export function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue
}