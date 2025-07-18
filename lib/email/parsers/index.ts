import { ParserRegistry } from './parser-registry'

/**
 * Register all available parsers
 * This should be called once when the application starts
 * 
 * UPDATE: We've removed all retailer-specific parsers in favor of
 * using Gemini AI for all email parsing. This provides better
 * accuracy and maintainability.
 */
export function registerParsers() {
  // Clear any existing parsers
  ParserRegistry.clear()
  
  // No longer registering retailer-specific parsers
  // All email parsing is now handled by Gemini AI
}

// Export commonly used classes
export { ParserRegistry, EmailClassifier } from './parser-registry'
export { BaseEmailParser } from './base-parser'
export type { EmailParser } from '@/lib/types/email'