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
/**
 * Move Helmet-injected SEO tags to the top of <head> (right after viewport).
 * Crawlers and Google often prefer early head tags over ones appended after JS/CSS.
 */
function promoteSeoHead(html) {
  const seoTagRegexes = [
    /<title[^>]*>[\s\S]*?<\/title>/gi,
    /<meta[^>]+name=["'](?:description|robots|keywords|googlebot)["'][^>]*>/gi,
    /<link[^>]+rel=["']canonical["'][^>]*>/gi,
    /<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi,
    /<script[^>]+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi,
  ]

  const collected = []
  let out = html
  for (const re of seoTagRegexes) {
    out = out.replace(re, (match) => {
      collected.push(match.replace(/\sdata-rh="true"/gi, ''))
      return ''
    })
  }
  if (!collected.length) return html

  const seoBlock = collected.join('\n    ')
  const viewportRe = /<meta\s+name=["']viewport["'][^>]*>/i
  if (viewportRe.test(out)) {
    return out.replace(viewportRe, (m) => `${m}\n\n    ${seoBlock}`)
  }
  return out.replace(/<head[^>]*>/i, (m) => `${m}\n    ${seoBlock}`)
}

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

async function loadServiceCities() {
  const mod = await import(url.pathToFileURL(path.join(clientRoot, 'src/constants/serviceCities.js')).href)
  return mod.SERVICE_CITIES || []
}

async function loadConditionSlugs() {
  const mod = await import(url.pathToFileURL(path.join(clientRoot, 'src/constants/conditions.js')).href)
  return mod.CONDITION_SLUGS || []
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

function installRequestFilter(page, allowedOrigin) {
  return page.setRequestInterception(true).then(() => {
    page.on('request', (req) => {
      const target = req.url()
      if (
        target.startsWith(allowedOrigin) ||
        target.startsWith('data:') ||
        target.startsWith('blob:')
      ) {
        req.continue()
        return
      }
      // External fonts/analytics never settle reliably in CI — skip for prerender.
      req.abort()
    })
  })
}

async function captureRoute(page, target, { timeoutMs = 60_000 } = {}) {
  await page.goto(target, { waitUntil: 'load', timeout: timeoutMs })
  // 10s is plenty for a local static server; a longer wait just burns CI build
  // minutes on routes whose h1 will never appear (e.g. blocked API data).
  await page.waitForSelector('h1', { timeout: Math.min(timeoutMs, 10_000) })
  // Let react-helmet-async flush title/meta after paint.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      }),
  )
  await page.evaluate(() => new Promise((r) => setTimeout(r, 200)))
  let html = await page.evaluate(() => `<!doctype html>\n${document.documentElement.outerHTML}`)
  return promoteSeoHead(html)
}

function routeToOutputPath(route) {
  const clean = route.replace(/^\/+|\/+$/g, '')
  if (!clean) return path.join(distDir, 'index.html')
  return path.join(distDir, clean, 'index.html')
}

async function main() {
  if (['1', 'true'].includes(String(process.env.SKIP_PRERENDER).toLowerCase())) {
    console.log('[prerender] SKIP_PRERENDER is set — skipping. dist/index.html keeps its baked-in SEO tags.')
    process.exit(0)
  }

  let puppeteer
  try {
    puppeteer = (await import('puppeteer')).default
  } catch (err) {
    console.error('[prerender] Missing optional dep `puppeteer`. Run `npm i -D puppeteer` to enable prerendering.')
    console.error('[prerender] Skipping prerender. The base dist/index.html already has SEO meta tags.')
    process.exit(0)
  }

  const cities = await loadServiceCities()
  const citySlugs = cities.map((c) => c.slug)
  const conditionSlugs = await loadConditionSlugs()
  const cityRoutes = citySlugs.map((slug) => `/physio-in/${slug}`)
  const conditionCityRoutes = citySlugs.flatMap((slug) =>
    conditionSlugs.map((cond) => `/physio-in/${slug}/${cond}`),
  )
  const nearMeCityRoutes = citySlugs.map((slug) => `/near-me-physio/${slug}`)
  const nearMeLocalityRoutes = cities.flatMap((city) =>
    (city.neighborhoods || [])
      .slice(0, 3)
      .map((name) =>
        `/near-me-physio/${city.slug}/${String(name)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')}`,
      ),
  )

  const routes = Array.from(
    new Set([
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/register-physio',
      '/near-me-physio',
      ...cityRoutes,
      ...conditionCityRoutes,
      ...nearMeCityRoutes,
      ...nearMeLocalityRoutes,
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
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      })
    } catch (err) {
      // A broken Chrome install (missing binary, missing shared libs, OOM) must
      // not fail the deploy — dist/index.html still carries baseline SEO tags.
      console.warn(`[prerender] Could not launch Chromium: ${err?.message || err}`)
      console.warn('[prerender] Skipping prerender. On Render: check .puppeteerrc.cjs cache dir and that devDependencies are installed.')
      server.close()
      process.exit(0)
    }
    let page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 900 })
    await page.setUserAgent('PhysiOkhomPrerender/1.0 (+static-build)')
    await installRequestFilter(page, origin)

    let routeIndex = 0
    let consecutiveFailures = 0
    for (const route of routes) {
      const outFile = routeToOutputPath(route)
      const outDir = path.dirname(outFile)
      fs.mkdirSync(outDir, { recursive: true })
      const target = `${origin}${route}`
      console.log(`[prerender] ${route} -> ${path.relative(clientRoot, outFile)}`)
      try {
        // Recycle the tab periodically to avoid Chromium slowdown on long runs.
        if (routeIndex > 0 && routeIndex % 25 === 0) {
          await page.close()
          const fresh = await browser.newPage()
          await fresh.setViewport({ width: 1280, height: 900 })
          await fresh.setUserAgent('PhysiOkhomPrerender/1.0 (+static-build)')
          await installRequestFilter(fresh, origin)
          page = fresh
        }
        const html = await captureRoute(page, target)
        fs.writeFileSync(outFile, html, 'utf8')
        consecutiveFailures = 0
      } catch (err) {
        console.warn(`[prerender] failed ${route}: ${err?.message || err}`)
        consecutiveFailures += 1
        // A dead browser (e.g. OOM-killed on a small CI machine) makes every
        // remaining route fail too — bail out instead of burning build minutes.
        if (consecutiveFailures >= 8) {
          console.warn('[prerender] 8 consecutive failures — aborting the rest of the run. Routes already written are kept.')
          break
        }
      }
      routeIndex += 1
    }
  } finally {
    if (browser) await browser.close()
    server.close()
  }

  console.log('[prerender] Done.')
}

main().catch((err) => {
  // Prerendering is an SEO enhancement, never a deploy gate: dist/index.html
  // ships with baseline SEO meta, so fail soft and let the deploy finish.
  console.error('[prerender] Unexpected error (deploy continues without prerender):', err)
  process.exit(0)
})
