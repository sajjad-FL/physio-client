import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function seoDistFilesPlugin() {
  return {
    name: 'seo-dist-files',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist')
      if (!fs.existsSync(distDir)) return

      const base = String(process.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173')
        .trim()
        .replace(/\/$/, '')

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

      const apiOrigin = String(process.env.VITE_API_PUBLIC_ORIGIN || '')
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
export default defineConfig({
  plugins: [react(), tailwindcss(), seoDistFilesPlugin()],
})
