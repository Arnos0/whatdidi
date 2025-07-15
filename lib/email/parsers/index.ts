import { ParserRegistry } from './parser-registry'
import { BolParser } from './retailers/bol-parser'

/**
 * Register all available parsers
 * This should be called once when the application starts
 */
export function registerParsers() {
  // Clear any existing parsers
  ParserRegistry.clear()
  
  // Register all retailer parsers
  ParserRegistry.register(new BolParser())
  
  // TODO: Add more parsers as they are implemented
  // ParserRegistry.register(new AmazonParser())
  // ParserRegistry.register(new CoolblueParser())
  // ParserRegistry.register(new ZalandoParser())
}

// Export commonly used classes
export { ParserRegistry, EmailClassifier } from './parser-registry'
export { BaseEmailParser } from './base-parser'
export type { EmailParser } from '@/lib/types/email'