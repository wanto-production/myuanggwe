import { PUBLIC_APP_BASE_URL } from '$env/static/public'

type PageItem = {
	loc: string
	lastmod?: string
	changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
	priority: number
}

const staticPages: PageItem[] = [
	{
		loc: '',
		changefreq: 'daily',
		priority: 1.0
	},
	{
		loc: 'login',
		changefreq: 'monthly',
		priority: 0.8
	},
	{
		loc: 'register',
		changefreq: 'monthly',
		priority: 0.8
	}
]

export async function GET() {
	const sitemap = generateSitemap(staticPages)

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	})
}

function generateSitemap(pages: PageItem[]): string {
	const lastmod = new Date().toISOString()

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
	.map(
		page => `  <url>
    <loc>${PUBLIC_APP_BASE_URL}${page.loc ? `/${page.loc}` : ''}</loc>
    <lastmod>${page.lastmod || lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`
}
