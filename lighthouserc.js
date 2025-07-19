module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run build && npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/orders',
        'http://localhost:3000/settings'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      }
    },
    assert: {
      assertions: {
        // Performance budgets
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        
        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 200000 }], // 200KB
        'resource-summary:image:size': ['error', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:font:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:total:size': ['error', { maxNumericValue: 1000000 }], // 1MB
        
        // Specific optimizations
        'unused-javascript': ['warn', { maxNumericValue: 20000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'uses-text-compression': 'error',
        'uses-responsive-images': 'error',
        'efficient-animated-content': 'error',
        'offscreen-images': 'warn',
        'render-blocking-resources': 'warn',
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        
        // PWA requirements
        'installable-manifest': 'error',
        'service-worker': 'error',
        'offline-start-url': 'warn',
        'apple-touch-icon': 'error',
        'themed-omnibox': 'error',
        'maskable-icon': 'warn',
        
        // Security
        'is-on-https': 'off', // Skip for local testing
        'uses-https': 'off', // Skip for local testing
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        
        // Best practices
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}