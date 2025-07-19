/**
 * Image optimization utilities
 */

/**
 * Generate a base64 blur placeholder for images
 */
export function generateBlurPlaceholder(color: string = '#f3f4f6'): string {
  // Create a simple 4x4 pixel blur placeholder
  return `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4">
      <rect width="4" height="4" fill="${color}"/>
    </svg>`
  )}`
}

/**
 * Get optimized image sizes for responsive images
 */
export function getResponsiveImageSizes(sizes: {
  mobile?: number
  tablet?: number
  desktop?: number
} = {}): string {
  const {
    mobile = 96,
    tablet = 128,
    desktop = 256
  } = sizes

  return `(max-width: 768px) ${mobile}px, (max-width: 1200px) ${tablet}px, ${desktop}px`
}

/**
 * Retailer color mapping for blur placeholders
 */
export const retailerColors: Record<string, string> = {
  'bol.com': '#0f7fda',
  'coolblue': '#0077be',
  'amazon.nl': '#232f3e',
  'zalando': '#ff6900',
  'mediamarkt': '#e30613',
  'albert heijn': '#0074d9',
  'hema': '#d8232a',
  'decathlon': '#0082c3',
  'asos': '#000000',
  'wehkamp': '#e31837'
}

/**
 * Get blur placeholder for specific retailer
 */
export function getRetailerBlurPlaceholder(retailer: string): string {
  const normalizedRetailer = retailer.toLowerCase().trim()
  const color = retailerColors[normalizedRetailer] || '#f3f4f6'
  return generateBlurPlaceholder(color)
}