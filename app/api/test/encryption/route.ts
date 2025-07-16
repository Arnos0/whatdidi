import { NextRequest, NextResponse } from 'next/server'
import { tokenEncryption } from '@/lib/oauth/oauth-service'

export async function GET(request: NextRequest) {
  try {
    // Test token encryption/decryption
    const testToken = 'test_token_12345'
    
    // Encrypt
    const encrypted = tokenEncryption.encrypt(testToken)
    
    // Decrypt
    const decrypted = tokenEncryption.decrypt(encrypted)
    
    // Verify
    const success = testToken === decrypted
    
    return NextResponse.json({
      success,
      test: {
        original: testToken,
        encrypted: encrypted.substring(0, 20) + '...',
        decrypted: success ? decrypted : 'FAILED',
        encryptionKeyPresent: !!process.env.TOKEN_ENCRYPTION_KEY
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      encryptionKeyPresent: !!process.env.TOKEN_ENCRYPTION_KEY
    }, { status: 500 })
  }
}