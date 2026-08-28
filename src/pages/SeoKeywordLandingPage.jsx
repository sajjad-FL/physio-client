import { useMemo } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SiteHeader from '../components/layout/SiteHeader'
import { findCityBySlug } from '../constants/serviceCities'
import { SEO_KEYWORD_PAGES } from '../constants/seoKeywordPages'
import { absoluteUrl, siteOrigin } from '../utils/siteMeta'

function findPageByPath(pathname) {
  const path = String(pathname || '')
    .replace(/\/+$/, '')
    .toLowerCase() || '/'
  return SEO_KEYWORD_PAGES.find((p) => p.path === path) || null
}

function buildStructuredData({ page, canonical, city }) {
  const siteBase = (siteOrigin() || 'https://physiokhom.com').replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        name: page.title,
        url: canonical,
        description: page.description,
        isPartOf: { '@type': 'WebSite', name: 'PhysiOkhom', url: `${siteBase}/` },
        about: {
          '@type': 'MedicalBusiness',
          name: 'PhysiOkhom',
          medicalSpecialty: 'Physiotherapy',
          ...(city
            ? {
                areaServed: {
                  '@type': 'City',
                  name: city.name,
                  containedInPlace: { '@type': 'AdministrativeArea', name: city.state },
                },
              }
            : {
                areaServed: { '@type': 'AdministrativeArea', name: 'Assam' },
              }),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteBase}/` },
          { '@type': 'ListItem', position: 2, name: page.h1, item: canonical },
        ],
      },
    ],
  }
}

export default function SeoKeywordLandingPage() {
  const { pathname } = useLocation()
  const page = useMemo(() => findPageByPath(pathname), [pathname])

  if (!page) {
    return <Navigate to="/" replace />
  }

  const city = page.relatedCitySlug ? findCityBySlug(page.relatedCitySlug) : null
  const canonical = absoluteUrl(page.path)
  const ogImage = absoluteUrl('/og-default.png')
  const keywords = Array.isArray(page.keywords) ? page.keywords.join(', ') : ''
  const ldJson = JSON.stringify(buildStructuredData({ page, canonical, city }))

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        {keywords ? <meta name="keywords" content={keywords} /> : null}
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PhysiOkhom" />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.description} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{ldJson}</script>
      </Helmet>

      <SiteHeader />

      <main>
        <section className="border-b border-slate-200 bg-mesh-hero">
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-16 lg:pt-24">
            <nav aria-label="Breadcrumb" className="mb-6 text-xs font-medium text-slate-500">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-slate-700">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-slate-700">{page.h1.split('—')[0].trim()}</li>
              </ol>
            </nav>
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
                PhysiOkhom home physiotherapy
              </p>
              <h1 className="type-hero mt-6 text-balance sm:leading-[1.08]">{page.h1}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">{page.intro}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  className="interactive-press inline-flex h-12 items-center justify-center rounded-xl bg-teal-600 px-8 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors hover:bg-teal-700"
                >
                  Book a home visit
                </Link>
                {city ? (
                  <Link
                    to={`/physio-in/${city.slug}`}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
                  >
                    Physiotherapist in {city.name}
                  </Link>
                ) : (
                  <Link
                    to="/near-me-physio"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
                  >
                    Find physio near me
                  </Link>
                )}
              </div>
              {page.keywords?.length ? (
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Related searches">
                  {page.keywords.map((term) => (
                    <li
                      key={term}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {term}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">Why book physio home with PhysiOkhom</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {(page.bullets || []).map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium leading-relaxed text-slate-700"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-slate-50 py-14 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">Explore more local physio pages</h2>
            <ul className="mt-6 flex flex-wrap gap-3">
              <li>
                <Link
                  to="/physio-in/kokrajhar"
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700"
                >
                  Physio in Kokrajhar
                </Link>
              </li>
              <li>
                <Link
                  to="/physio-home-kokrajhar"
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700"
                >
                  Physio home Kokrajhar
                </Link>
              </li>
              <li>
                <Link
                  to="/physio-home-assam"
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700"
                >
                  Physio home Assam
                </Link>
              </li>
              <li>
                <Link
                  to="/near-me-physio/kokrajhar"
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700"
                >
                  Physio near me Kokrajhar
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
