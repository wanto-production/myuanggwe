import { PUBLIC_APP_BASE_URL } from '$env/static/public'

const pages = [
  { url: '', priority: 1.0, changefreq: 'daily' as const },
  { url: 'login', priority: 0.8, changefreq: 'monthly' as const },
  { url: 'register', priority: 0.8, changefreq: 'monthly' as const }
]

export async function GET() {
  return new Response(generateSitemap(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

function generateSitemap() {
  const now = new Date().toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
      .map(
        ({ url, priority, changefreq }) => `  <url>
    <loc>${PUBLIC_APP_BASE_URL}${url ? `/${url}` : ''}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
      )
      .join('\n')}
</urlset>`
}
