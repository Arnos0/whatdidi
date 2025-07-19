import 'server-only'
import { claudeService } from './claude-service'
import { geminiService } from './gemini-service'
import { GeminiService } from './gemini-service'
import { ClaudeService } from './claude-service'

// Type for the AI service interface
export interface AIService {
  analyzeEmail: (emailContent: {
    subject: string
    from: string
    date: Date
    body: string
  }) => Promise<{
    isOrder: boolean
    orderData?: {
      orderNumber: string | null
      retailer: string
      amount: number
      currency: string
      orderDate: string
      status: 'confirmed' | 'shipped' | 'delivered'
      estimatedDelivery?: string | null
      trackingNumber?: string | null
      carrier?: string | null
      items?: Array<{
        name: string
        quantity: number
        price: number
      }>
      confidence: number
    }
    debugInfo?: {
      language: string
      emailType: string
    }
  }>
  
  batchAnalyzeEmails: (emails: Array<{
    id: string
    subject: string
    from: string
    date: Date
    body: string
  }>) => Promise<Map<string, {
    isOrder: boolean
    orderData?: any
    debugInfo?: any
  }>>
}

// Get the AI service based on environment variable
function getAIService(): AIService {
  const provider = process.env.AI_SERVICE || 'gemini' // Default to Gemini
  
  switch (provider.toLowerCase()) {
    case 'claude':
      console.log('Using Claude AI service for email parsing')
      return claudeService
    case 'gemini':
      console.log('Using Gemini AI service for email parsing')
      return geminiService
    default:
      console.warn(`Unknown AI service provider: ${provider}, defaulting to Gemini`)
      return geminiService
  }
}

// Lazy initialization of AI service
let _aiService: AIService | null = null

// Export the selected AI service with lazy initialization
export const aiService: AIService = {
  analyzeEmail: async (...args) => {
    if (!_aiService) {
      _aiService = getAIService()
    }
    return _aiService.analyzeEmail(...args)
  },
  
  batchAnalyzeEmails: async (...args) => {
    if (!_aiService) {
      _aiService = getAIService()
    }
    return _aiService.batchAnalyzeEmails(...args)
  }
}

// Export the shouldAnalyzeEmail function (same for both services)
export const shouldAnalyzeEmail = (email: {
  subject: string
  from: string
  body: string
}): boolean => {
  // Use the static method from either service (they're identical)
  return GeminiService.shouldAnalyzeEmail(email)
}