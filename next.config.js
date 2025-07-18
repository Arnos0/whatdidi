/** @type {import('next').NextConfig} */

// ⚠️ PORT CHECK: Ensure we're using port 3002 in development
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || '3000'
  if (port !== '3002') {
    console.log('\n🚨🚨🚨 CRITICAL ERROR 🚨🚨🚨')
    console.log('❌ WRONG PORT DETECTED!')
    console.log(`   Current port: ${port}`)
    console.log('   Expected port: 3002')
    console.log('')
    console.log('✅ SOLUTION: Use one of these commands:')
    console.log('   ./start-dev.sh')
    console.log('   PORT=3002 npm run dev')
    console.log('   npm run dev (now defaults to 3002)')
    console.log('\n🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n')
  } else {
    console.log('✅ Correct port detected: 3002')
  }
}

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;