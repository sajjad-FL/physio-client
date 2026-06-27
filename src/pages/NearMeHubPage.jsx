import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SiteHeader from '../components/layout/SiteHeader'
import { SERVICE_CITIES, findCityBySlug } from '../constants/serviceCities'
import { absoluteUrl, siteOrigin } from '../utils/siteMeta'

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fromSlug(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function pickCityLocalities(city, localitySlug) {
  if (!city) return []
  const all = Array.isArray(city.neighborhoods) ? city.neighborhoods : []
  if (!localitySlug) return all.slice(0, 8)
  const guessed = fromSlug(localitySlug)
  const exact = all.find((item) => toSlug(item) === localitySlug)
  return [exact || guessed]
}

function buildFaq(city, localities) {
  if (!city) {
    return [
      {
        q: 'How can I find a physiotherapist near me in Assam?',
        a: 'Open PhysiOkhom near-me pages, choose your city, and continue to the matching city page to book a verified home visit physiotherapist.',
      },
      {
        q: 'Do you provide home physiotherapy in multiple Assam cities?',
        a: 'Yes. PhysiOkhom currently serves key cities and nearby localities across Assam through city-specific pages and booking flows.',
      },
      {
        q: 'What conditions can I book home physiotherapy for?',
        a: 'Common use cases include back pain, knee pain, post-surgery rehab, stroke recovery, and general mobility support at home.',
      },
    ]
  }

  const localityLine = localities.slice(0, 3).join(', ')
  return [
    {
      q: `How do I book a physio near me in ${city.name}?`,
      a: `Open the ${city.name} near-me guide, select your locality, and proceed to booking. PhysiOkhom matches you with a verified home visit physiotherapist.`,
    },
    {
      q: `Which localities in ${city.name} are covered?`,
      a: localityLine
        ? `Coverage includes localities like ${localityLine}, with support across nearby areas depending on slot availability.`
        : `Coverage is available across major neighborhoods in ${city.name}; share your full address during booking for accurate matching.`,
    },
    {
      q: `Can I get same-day home physiotherapy in ${city.name}?`,
      a: `Same-day or next-day appointments may be available in ${city.name} based on open slots and clinician availability in your locality.`,
    },
  ]
}

function buildStructuredData({ city, canonical, faq, citySlug }) {
  const siteBase = (siteOrigin() || 'https://physiokhom.com').replace(/\/$/, '')
  const pageName = city ? `Physio Near Me in ${city.name}` : 'Physio Near Me in Assam'
  const cityItem = city ? `${siteBase}/near-me-physio/${citySlug}` : canonical

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteBase}/` },
          { '@type': 'ListItem', position: 2, name: 'Near Me Physio', item: `${siteBase}/near-me-physio` },
          ...(city ? [{ '@type': 'ListItem', position: 3, name: `Near Me in ${city.name}`, item: cityItem }] : []),
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        name: pageName,
        url: canonical,
      },
    ],
  }
}

export default function NearMeHubPage() {
  const { city: citySlug, locality: localitySlug } = useParams()
  const city = useMemo(() => (citySlug ? findCityBySlug(citySlug) : null), [citySlug])

  if (citySlug && !city) {
    return <Navigate to="/near-me-physio" replace />
  }

  const localities = pickCityLocalities(city, localitySlug)
  const canonicalPath = citySlug
    ? localitySlug
      ? `/near-me-physio/${citySlug}/${localitySlug}`
      : `/near-me-physio/${citySlug}`
    : '/near-me-physio'
  const canonical = absoluteUrl(canonicalPath)
  const ogImage = absoluteUrl('/og-default.png')
  const title = city
    ? `Physio Near Me in ${city.name} | PhysiOkhom`
    : 'Physio Near Me in Assam | PhysiOkhom Locality Hub'
  const description = city
    ? `Find a home visit physiotherapist near you in ${city.name}, ${city.state}. PhysiOkhom covers local areas like ${localities.slice(0, 3).join(', ')} with verified clinicians.`
    : 'Explore city and locality pages to find a verified home visit physiotherapist near you in Assam.'
  const faq = buildFaq(city, localities)
  const ldJson = JSON.stringify(buildStructuredData({ city, canonical, faq, citySlug }))

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PhysiOkhom" />
        <meta name="application-name" content="PhysiOkhom" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <script type="application/ld+json">{ldJson}</script>
      </Helmet>

      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Near me search hub</p>
          <h1 className="type-hero mt-3">
            {city ? `Physio near me in ${city.name}` : 'Find a physio near me in Assam'}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
            {city
              ? `Use this local guide to discover physiotherapy home visits around ${city.name}. Choose your locality and continue to the city booking page.`
              : 'Browse city-level coverage and locality clusters to find the nearest available physiotherapist for home treatment.'}
          </p>
        </section>

        {city ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="type-page-title">Popular localities in {city.name}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {localities.map((name) => (
                <li key={name}>
                  <Link
                    to={`/physio-in/${city.slug}`}
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                  >
                    Physiotherapist near {name}, {city.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link to={`/physio-in/${city.slug}`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
                Open full {city.name} city page →
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="type-page-title">Cities and local clusters</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_CITIES.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    to={`/near-me-physio/${entry.slug}`}
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                  >
                    Physio near me in {entry.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="type-page-title">
            {city ? `FAQ: physio near me in ${city.name}` : 'FAQ: physio near me in Assam'}
          </h2>
          <dl className="mt-6 space-y-6">
            {faq.map(({ q, a }) => (
              <div key={q} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <dt className="text-base font-semibold text-slate-900">{q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  )
}
