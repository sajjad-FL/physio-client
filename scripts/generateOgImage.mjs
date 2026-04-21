#!/usr/bin/env node
/**
 * Generates a 1200x630 PNG at public/og-default.png for Open Graph / Twitter
 * previews. Run once (or re-run if branding changes):
 *
 *     npm run og:generate
 *
 * Requires `puppeteer` (already devDependency for prerendering).
 */
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const outFile = path.resolve(__dirname, '..', 'public', 'og-default.png')

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1200px; height: 630px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
      background:
        radial-gradient(1200px 600px at 80% -10%, rgba(13, 148, 136, 0.35), transparent 60%),
        radial-gradient(900px 600px at 10% 110%, rgba(16, 185, 129, 0.25), transparent 60%),
        linear-gradient(135deg, #0f172a 0%, #0b4f45 50%, #0d9488 100%);
      color: #f8fafc;
      padding: 72px 80px;
      position: relative;
      overflow: hidden;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .logo .mark {
      width: 48px; height: 48px;
      border-radius: 14px;
      background: #0d9488;
      display: inline-flex; align-items: center; justify-content: center;
      box-shadow: 0 20px 40px -15px rgba(13, 148, 136, 0.8);
    }
    .logo .mark svg { width: 22px; height: 22px; stroke: #fff; stroke-width: 2.2; fill: none; }
    .content { position: absolute; left: 80px; right: 80px; bottom: 72px; }
    h1 {
      font-size: 72px;
      line-height: 1.04;
      letter-spacing: -0.02em;
      font-weight: 700;
      max-width: 980px;
    }
    p {
      margin-top: 22px;
      font-size: 30px;
      line-height: 1.3;
      color: rgba(248, 250, 252, 0.82);
      max-width: 880px;
      font-weight: 500;
    }
    .tag {
      position: absolute;
      top: 72px; right: 80px;
      font-size: 18px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 600;
      color: rgba(248, 250, 252, 0.85);
      border: 1px solid rgba(248, 250, 252, 0.28);
      padding: 10px 18px;
      border-radius: 999px;
      backdrop-filter: blur(6px);
    }
    .cities {
      margin-top: 28px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .chip {
      font-size: 18px;
      font-weight: 600;
      color: #083a33;
      background: #a7f3d0;
      border-radius: 999px;
      padding: 8px 16px;
    }
  </style>
</head>
<body>
  <div class="logo">
    <span class="mark">
      <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
    </span>
    NearbyPhysio
  </div>
  <div class="tag">Assam \u00B7 Verified home visits</div>
  <div class="content">
    <h1>Physio near me in Assam \u2014 home visit physiotherapist</h1>
    <p>Verified physiotherapists at your door for back pain, knee pain, post-surgery rehab and stroke recovery.</p>
    <div class="cities">
      <span class="chip">Guwahati</span>
      <span class="chip">Barpeta</span>
      <span class="chip">Bongaigaon</span>
      <span class="chip">Bijni</span>
      <span class="chip">Kokrajhar</span>
    </div>
  </div>
</body>
</html>`

async function main() {
  const { default: puppeteer } = await import('puppeteer')
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const buf = await page.screenshot({ type: 'png', omitBackground: false, clip: { x: 0, y: 0, width: 1200, height: 630 } })
    fs.writeFileSync(outFile, buf)
    console.log(`[og] wrote ${path.relative(path.resolve(__dirname, '..'), outFile)} (${buf.length} bytes)`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[og] failed:', err)
  process.exit(1)
})
