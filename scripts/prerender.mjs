#!/usr/bin/env node
/**
 * Post-build prerender: serve `dist/` with a tiny static server, launch headless
 * Chromium, visit each public route, wait for react-helmet-async to flush meta,
 * then write fully-rendered HTML to dist/<route>/index.html.
 *
 * Why this exists:
 *   The app is a Vite SPA (CSR). Raw index.html has critical meta (see index.html),
 *   but per-route JSON-LD, canonical, and body content is rendered by React. Many
 *   crawlers (Bing, social previews, LLM crawlers) do not execute JS reliably.
 *   Prerendering gives every public URL a self-contained HTML document that
 *   crawlers can index without executing JS — Google included.
 *
 * Run after `vite build`. Requires `puppeteer` as a devDependency.
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import http from 'node:http'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const clientRoot = path.resolve(__dirname, '..')
const distDir = path.join(clientRoot, 'dist')

if (!fs.existsSync(distDir)) {
  console.error('[prerender] dist/ not found. Run `vite build` first.')
  process.exit(1)
}

/**
 * Remove SEO head tags that react-helmet-async will re-populate at runtime.
 * Keeps charset/viewport/favicon/fonts/manifest/theme-color.
 */
function stripStaticSeoTags(html) {
  const patterns = [
    /<title>[\s\S]*?<\/title>\s*/gi,
    /<meta\s+name=["']description["'][^>]*>\s*/gi,
    /<meta\s+name=["']keywords["'][^>]*>\s*/gi,
    /<meta\s+name=["']robots["'][^>]*>\s*/gi,
    /<meta\s+name=["']googlebot["'][^>]*>\s*/gi,
    /<link\s+rel=["']canonical["'][^>]*>\s*/gi,
    /<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi,
    /<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi,
    /<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>\s*/gi,
  ]
  let out = html
  for (const p of patterns) out = out.replace(p, '')
  return out
}

async function loadServiceCitySlugs() {
  const mod = await import(url.pathToFileURL(path.join(clientRoot, 'src/constants/serviceCities.js')).href)
  return mod.CITY_SLUGS || (mod.SERVICE_CITIES || []).map((c) => c.slug)
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
}

function startServer(rootDir, rootIndexHtml) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqUrl = decodeURIComponent((req.url || '/').split('?')[0])
      const sendIndex = () => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(rootIndexHtml)
      }
      if (reqUrl === '/' || reqUrl === '/index.html') {
        sendIndex()
        return
      }
      let filePath = path.join(rootDir, reqUrl)
      if (!filePath.startsWith(rootDir)) {
        res.statusCode = 403
        res.end('Forbidden')
        return
      }
      fs.stat(filePath, (err, stat) => {
        if (err || !stat || stat.isDirectory()) {
          // SPA fallback: any missing file, empty folder, or directory returns
          // the cached pre-render root HTML so the router can render the route.
          sendIndex()
          return
        }
        fs.readFile(filePath, (err2, buf) => {
          if (err2) {
            sendIndex()
            return
          }
          const ext = path.extname(filePath).toLowerCase()
          res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
          res.end(buf)
        })
      })
    })
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ server, port })
    })
  })
}

function routeToOutputPath(route) {
  const clean = route.replace(/^\/+|\/+$/g, '')
  if (!clean) return path.join(distDir, 'index.html')
  return path.join(distDir, clean, 'index.html')
}

async function main() {
  let puppeteer
  try {
    puppeteer = (await import('puppeteer')).default
  } catch (err) {
    console.error('[prerender] Missing optional dep `puppeteer`. Run `npm i -D puppeteer` to enable prerendering.')
    console.error('[prerender] Skipping prerender. The base dist/index.html already has SEO meta tags.')
    process.exit(0)
  }

  const citySlugs = await loadServiceCitySlugs()
  const cityRoutes = citySlugs.map((slug) => `/physio-in/${slug}`)

  const routes = Array.from(
    new Set([
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/register-physio',
      ...cityRoutes,
    ]),
  )

  // Cache the original, un-prerendered root HTML and serve it for every SPA
  // fallback. Prevents earlier routes (e.g. /) from leaking their rendered DOM
  // or head tags into later ones.
  //
  // We also strip baked-in SEO head tags (title/description/canonical/OG/twitter/
  // robots/JSON-LD) from the served copy so react-helmet-async owns them
  // exclusively during prerender. Otherwise crawlers would see duplicate head
  // tags (one from static index.html, one from Helmet) in every prerendered
  // route. The on-disk `dist/index.html` keeps its inline SEO tags as a
  // no-JS safety net, and is overwritten by the Helmet-rendered homepage
  // capture during this prerender pass.
  const rawRootHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')
  const rootIndexHtml = stripStaticSeoTags(rawRootHtml)

  const { server, port } = await startServer(distDir, rootIndexHtml)
  const origin = `http://127.0.0.1:${port}`
  console.log(`[prerender] Serving dist on ${origin}`)

  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    await page.setUserAgent('NearbyPhysioPrerender/1.0 (+static-build)')

    for (const route of routes) {
      const outFile = routeToOutputPath(route)
      const outDir = path.dirname(outFile)
      fs.mkdirSync(outDir, { recursive: true })
      const target = `${origin}${route}`
      console.log(`[prerender] ${route} -> ${path.relative(clientRoot, outFile)}`)
      try {
        await page.goto(target, { waitUntil: 'networkidle0', timeout: 45_000 })
        await page.evaluate(() => new Promise((r) => setTimeout(r, 150)))
        const html = await page.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`)
        fs.writeFileSync(outFile, html, 'utf8')
      } catch (err) {
        console.warn(`[prerender] failed ${route}: ${err?.message || err}`)
      }
    }
  } finally {
    if (browser) await browser.close()
    server.close()
  }

  console.log('[prerender] Done.')
}

main().catch((err) => {
  console.error('[prerender] Unexpected error:', err)
  process.exit(1)
})
