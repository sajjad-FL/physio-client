import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Writes dist/robots.txt and dist/sitemap.xml after build.
 * @param {{ siteUrl: string | undefined, mode: string, apiPublicOrigin: string | undefined }} opts
 */
function seoDistFilesPlugin({ siteUrl, mode, apiPublicOrigin }) {
  return {
    name: 'seo-dist-files',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist')
      if (!fs.existsSync(distDir)) return

      const base = String(siteUrl || 'http://localhost:5173')
        .trim()
        .replace(/\/$/, '')

      if (
        mode === 'production' &&
        (base.includes('localhost') || base.includes('127.0.0.1'))
      ) {
        throw new Error(
          'seo-dist-files: Set VITE_PUBLIC_SITE_URL to your public HTTPS origin for production builds (e.g. https://nearbyphysio.com). See client/.env.production or your host build environment.',
        )
      }

      const robotsBody = `User-agent: *
Allow: /

Disallow: /dashboard
Disallow: /book
Disallow: /physio
Disallow: /admin
Disallow: /profile
Disallow: /unauthorized
Disallow: /physio-dashboard

Sitemap: ${base}/sitemap.xml
`

      const apiOrigin = String(apiPublicOrigin || '')
        .trim()
        .replace(/\/$/, '')
      const robotsExtra =
        apiOrigin.length > 0 ? `Sitemap: ${apiOrigin}/api/seo/physio-sitemap.xml\n` : ''

      fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsBody + robotsExtra, 'utf8')

      const staticPaths = ['/', '/login', '/register', '/forgot-password', '/register-physio']
      const urlBlocks = staticPaths.map((p) => {
        const loc = p === '/' ? `${base}/` : `${base}${p}`
        const priority = p === '/' ? '1.0' : '0.7'
        return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
      })
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks.join('\n')}
</urlset>
`
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Shell / CI overrides committed .env.production
  const siteUrl = process.env.VITE_PUBLIC_SITE_URL || env.VITE_PUBLIC_SITE_URL
  const apiPublicOrigin = process.env.VITE_API_PUBLIC_ORIGIN || env.VITE_API_PUBLIC_ORIGIN

  return {
    plugins: [
      react(),
      tailwindcss(),
      seoDistFilesPlugin({ siteUrl, mode, apiPublicOrigin }),
    ],
  }
})
