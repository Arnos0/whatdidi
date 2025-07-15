#!/usr/bin/env node

const crypto = require('crypto');

// Generate a secure random key
const key = crypto.randomBytes(32).toString('base64');

console.log('\n🔐 Generated Encryption Key:');
console.log('─'.repeat(50));
console.log(key);
console.log('─'.repeat(50));
console.log('\nAdd this to your .env.local file:');
console.log(`TOKEN_ENCRYPTION_KEY=${key}`);
console.log('\n⚠️  Keep this key secret and never commit it to version control!\n');