import { NextResponse } from 'next/server'
import { registerParsers, ParserRegistry } from '@/lib/email/parsers'

export async function GET() {
  try {
    // Register all parsers
    registerParsers()
    
    // Get all registered parsers
    const parsers = ParserRegistry.getAllParsers()
    const parserInfo = parsers.map(parser => ({
      name: parser.getRetailerName(),
      domains: parser.getRetailerDomains()
    }))
    
    return NextResponse.json({
      count: parsers.length,
      parsers: parserInfo
    })
  } catch (error) {
    console.error('Error testing parsers:', error)
    return NextResponse.json({ error: 'Failed to test parsers' }, { status: 500 })
  }
}