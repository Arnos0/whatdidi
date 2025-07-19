import type { Metadata } from 'next'

// Base configuration for consistent metadata
const SITE_CONFIG = {
  name: 'WhatDidiShop',
  description: 'Never lose track of what you bought. Automatically track all your online purchases and deliveries in one place.',
  url: 'https://whatdidishop.com',
  twitter: '@whatdidishop',
} as const

/**
 * Generate canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_CONFIG.url}${normalizedPath}`
}

/**
 * Create base metadata with canonical URL
 */
export function createMetadata({
  title,
  description = SITE_CONFIG.description,
  path = '/',
  noIndex = false,
}: {
  title: string
  description?: string
  path?: string
  noIndex?: boolean
}): Metadata {
  const canonicalUrl = getCanonicalUrl(path)
  
  return {
    title,
    description,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonicalUrl,
      title,
      description,
      siteName: SITE_CONFIG.name,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: SITE_CONFIG.twitter,
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}

/**
 * Create metadata for dashboard pages
 */
export function createDashboardMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  noIndex?: boolean
}): Metadata {
  return createMetadata({
    title: `${title} - ${SITE_CONFIG.name}`,
    description,
    path,
    noIndex,
  })
}

/**
 * Create metadata for order pages
 */
export function createOrderMetadata({
  orderNumber,
  retailer,
  orderId,
}: {
  orderNumber: string
  retailer: string
  orderId: string
}): Metadata {
  return createMetadata({
    title: `Order #${orderNumber} from ${retailer} - ${SITE_CONFIG.name}`,
    description: `Track your order #${orderNumber} from ${retailer}. View order details, delivery status, and more.`,
    path: `/orders/${orderId}`,
  })
}

/**
 * Create metadata for auth pages (no-index)
 */
export function createAuthMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  return createMetadata({
    title: `${title} - ${SITE_CONFIG.name}`,
    description,
    path,
    noIndex: true, // Don't index auth pages
  })
}