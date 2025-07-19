/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
  // Image optimization configuration
  images: {
    // Enable modern formats
    formats: ['image/webp', 'image/avif'],
    
    // Allowed domains for external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    
    // Define responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  experimental: {
    scrollRestoration: true,
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
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
          // Performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Specific caching for images
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
};

module.exports = withBundleAnalyzer(nextConfig);