# PhysioKhom — Client

Vite + React 19 SPA for physiokhom.com.

## Scripts

- `npm run dev` — local dev server.
- `npm run build` — full production build: `vite build` + **post-build prerender** (see `scripts/prerender.mjs`). The prerender generates self-contained HTML for every public route so crawlers without JS (Bing, social previews, many LLM crawlers) can still index page-specific meta, JSON-LD, and body copy.
- `npm run build:no-prerender` — `vite build` only (skip prerender). Useful when iterating locally.
- `npm run prerender` — re-run only the prerender step against an existing `dist/`.
- `npm run og:generate` — regenerate `public/og-default.png` (1200×630) from `scripts/generateOgImage.mjs`.
- `npm run preview` — preview the built bundle locally.

## SEO setup

### What is already done in code

| Area | Location |
|------|----------|
| Baseline meta, OG, Twitter, JSON-LD (`WebSite` + `MedicalBusiness`) in raw HTML | [`index.html`](index.html) |
| Per-page `react-helmet-async` (title, canonical, OG, JSON-LD) | [`src/pages/HomePage.jsx`](src/pages/HomePage.jsx), [`src/pages/CityLandingPage.jsx`](src/pages/CityLandingPage.jsx) |
| 5 Assam district landing pages at `/physio-in/<slug>` (Guwahati, Barpeta, Bongaigaon, Bijni, Kokrajhar) | [`src/constants/serviceCities.js`](src/constants/serviceCities.js), [`src/pages/CityLandingPage.jsx`](src/pages/CityLandingPage.jsx) |
| Post-build prerender to static HTML per route | [`scripts/prerender.mjs`](scripts/prerender.mjs) |
| `robots.txt` (with `Sitemap:` lines) and `sitemap.xml` (10 URLs: home + 4 auth + 5 cities) | built into `dist/` by the `seo-dist-files` plugin in [`vite.config.js`](vite.config.js) |
| Server sitemap of individual physio profiles | [`../server/controllers/seoController.js`](../server/controllers/seoController.js) at `GET /api/seo/physio-sitemap.xml` |
| Private routes (`/dashboard`, `/physio`, `/admin`, `/book`, `/profile`) set `noindex` | [`src/components/seo/SeoNoIndex.jsx`](src/components/seo/SeoNoIndex.jsx) |

### Required build env

Set these in your host (Render, Netlify, Vercel, etc.) for production builds:

- `VITE_PUBLIC_SITE_URL=https://physiokhom.com` (required — the SEO plugin throws if this is `localhost` in production)
- `VITE_API_URL=https://api.physiokhom.com/api`
- `VITE_API_PUBLIC_ORIGIN=https://api.physiokhom.com` (optional — adds a second `Sitemap:` line to `robots.txt` pointing at the physio profile sitemap)

### Off-page SEO checklist (you must do this manually)

No amount of code will make you rank for competitive queries like "physio near me" or "nearby physio" without these off-page signals. Expect 4–12 weeks for initial ranking movement.

- [ ] **Google Search Console** — verify `https://physiokhom.com`, submit `https://physiokhom.com/sitemap.xml`, request indexing of `/` and each `/physio-in/*` city page, monitor the Coverage and Performance reports.
- [ ] **Bing Webmaster Tools** — same as GSC. Bing reaches ~10% of Indian desktop searches plus ChatGPT/Copilot search.
- [ ] **Google Business Profile** — create/verify a listing for PhysioKhom. This is what actually surfaces in the "map pack" for local "near me" queries. Add photos, services, hours, and encourage early reviews.
- [ ] **Directory listings / backlinks** — submit to Justdial, Sulekha, Practo (partner program), Lybrate, and Indian healthcare/wellness directories. Each inbound link helps.
- [ ] **City-specific Google Business Profiles** — when you open operations in new cities, add a GBP per city for local map-pack coverage.
- [ ] **Content cadence** — publish 2–3 blog posts per month (e.g. "Exercises for sciatica at home", "Physiotherapy after knee replacement", "Home physio vs clinic physio in India"). Add a `/blog` route when ready.
- [ ] **Physiotherapist profiles** — encourage patients to leave reviews on physio profile pages; each profile URL is already in `/api/seo/physio-sitemap.xml`.
- [ ] **Social presence** — set up Instagram, Facebook, LinkedIn with consistent branding and a link back to physiokhom.com. Social signals indirectly help by driving referral traffic and brand searches.
- [ ] **Page Speed / Core Web Vitals** — run [PageSpeed Insights](https://pagespeed.web.dev/) on `/` and the city pages after deploy; aim for LCP < 2.5s on mobile.

### Verification after deploy

1. `curl -s https://physiokhom.com/ | grep -i 'og:title\|application/ld\+json'` — confirm OG + JSON-LD are in the HTML without JS execution.
2. `curl -s https://physiokhom.com/physio-in/guwahati/ | grep '<h1'` — confirm city page is prerendered.
3. `curl -s https://physiokhom.com/sitemap.xml` — confirm 10 URLs.
4. Paste `https://physiokhom.com/` into the [Rich Results Test](https://search.google.com/test/rich-results) — should detect `MedicalBusiness`, `WebSite`, and `FAQPage`.
5. Paste a city URL into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) to confirm the 1200×630 OG image renders.
