import { NextResponse } from 'next/server'
import { serverOrderQueries } from '@/lib/supabase/server-queries'

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlElements = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`
}

export async function GET() {
  try {
    const baseUrl = 'https://whatdidishop.com'
    const now = new Date().toISOString()

    // Static pages (only public pages)
    const staticUrls: SitemapUrl[] = [
      {
        loc: `${baseUrl}/`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 1.0,
      },
      {
        loc: `${baseUrl}/dashboard`,
        lastmod: now,
        changefreq: 'daily',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}/waitlist`,
        lastmod: now,
        changefreq: 'monthly',
        priority: 0.4,
      },
    ]

    // Note: Private pages (orders, settings, individual order pages) are excluded
    // as they contain private user data and have noindex directives

    // Use only static URLs - no private order pages
    const allUrls = staticUrls

    // Generate XML
    const sitemapXml = generateSitemapXml(allUrls)

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=86400, stale-while-revalidate', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Return basic sitemap on error
    const basicSitemap = generateSitemapXml([
      {
        loc: 'https://whatdidishop.com/',
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 1.0,
      }
    ])

    return new NextResponse(basicSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600', // Shorter cache on error
      },
    })
  }
}