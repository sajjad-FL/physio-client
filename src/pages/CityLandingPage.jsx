import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SiteHeader from '../components/layout/SiteHeader'
import { SERVICE_CITIES, findCityBySlug } from '../constants/serviceCities'
import { absoluteUrl, siteOrigin } from '../utils/siteMeta'

const TREATMENTS = [
  { title: 'Back pain', slug: 'back-pain', blurb: 'Lower-back pain, sciatica, disc issues and posture-related pain.' },
  { title: 'Knee pain', slug: 'knee-pain', blurb: 'Arthritis, ligament strain, post-replacement rehab and meniscus recovery.' },
  { title: 'Neck and shoulder pain', slug: 'neck-shoulder-pain', blurb: 'Cervical spondylosis, frozen shoulder, and desk-job stiffness.' },
  { title: 'Post-surgery rehab', slug: 'post-surgery-rehab', blurb: 'Guided recovery after orthopedic, spinal or cardiac surgery.' },
  { title: 'Stroke and paralysis', slug: 'stroke-paralysis', blurb: 'Mobility, strength and daily-life rehabilitation at home.' },
  { title: 'Sports injuries', slug: 'sports-injury', blurb: 'Ligament sprains, muscle tears and return-to-sport programs.' },
]

function buildFaq(city) {
  return [
    {
      q: `How do I book a physiotherapist near me in ${city.name}?`,
      a: `Open PhysiOkhom, pick your slot and share your address in ${city.name}. We match you with a verified physiotherapist who does home visits in your locality and confirm the appointment after payment.`,
    },
    {
      q: `Do you cover all areas of ${city.name}?`,
      a: `We actively serve most major neighborhoods including ${city.neighborhoods.slice(0, 5).join(', ')}${city.neighborhoods.length > 5 ? ' and more' : ''}. If you are searching for a physiotherapist in ${city.name}, ${city.state}, share your exact address and we assign the nearest available clinician.`,
    },
    {
      q: `How much does a home visit physiotherapist cost in ${city.name}?`,
      a: `Fees vary by physiotherapist, experience level, and session length. You see the per-session price before you confirm the booking — no hidden charges and secure online payment.`,
    },
    {
      q: `Are the physiotherapists in ${city.name} verified?`,
      a: `Yes. Every clinician marked as verified has completed our platform checks, including qualification and ID verification. You can read reviews on each physiotherapist's public profile before you book.`,
    },
    {
      q: `Can I get a physiotherapist at home the same day in ${city.name}?`,
      a: `Same-day or next-day home visits are often available depending on slot availability in your area. Check open slots in your preferred ${city.name} neighborhood after logging in.`,
    },
  ]
}

function cityStructuredData({ city, canonical, ogImage, faq }) {
  const siteBase = (siteOrigin() || 'https://physiokhom.com').replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalBusiness',
        '@id': `${canonical}#organization`,
        name: `PhysiOkhom — Home Visit Physiotherapy in ${city.name}`,
        url: canonical,
        image: ogImage,
        description: `Book verified home visit physiotherapists in ${city.name}, ${city.state}. Physiotherapist at home for back pain, knee pain, post-surgery rehab and more.`,
        medicalSpecialty: 'Physiotherapy',
        priceRange: '₹₹',
        address: {
          '@type': 'PostalAddress',
          addressLocality: city.name,
          addressRegion: city.state,
          addressCountry: 'IN',
        },
        knowsAbout: ['Physiotherapy', 'Rehabilitation', 'Mobility care', 'Home visit physiotherapy'],
        areaServed: {
          '@type': 'City',
          name: city.name,
          containedInPlace: { '@type': 'AdministrativeArea', name: city.state },
          ...(typeof city.lat === 'number' && typeof city.lng === 'number'
            ? {
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: city.lat,
                  longitude: city.lng,
                },
              }
            : {}),
        },
        availableService: [
          { '@type': 'MedicalTherapy', name: `Back pain physiotherapy in ${city.name}` },
          { '@type': 'MedicalTherapy', name: `Knee pain physiotherapy in ${city.name}` },
          { '@type': 'MedicalTherapy', name: `Post-surgery rehabilitation in ${city.name}` },
          { '@type': 'MedicalTherapy', name: `Stroke and paralysis rehabilitation in ${city.name}` },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteBase}/` },
          { '@type': 'ListItem', position: 2, name: `Physiotherapist in ${city.name}`, item: canonical },
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
    ],
  }
}

export default function CityLandingPage() {
  const { city: slug } = useParams()
  const city = useMemo(() => findCityBySlug(slug), [slug])

  if (!city) {
    return <Navigate to="/" replace />
  }

  const canonical = absoluteUrl(`/physio-in/${city.slug}`)
  const ogImage = absoluteUrl('/og-default.png')
  const title = `Physiotherapist in ${city.name}, ${city.state} — Home Visit | PhysiOkhom`
  const description = `Looking for a physiotherapist in ${city.name}, ${city.state}? PhysiOkhom helps you book a verified home visit physiotherapist near you for back pain, knee pain, post-surgery rehab and stroke recovery — including ${city.neighborhoods.slice(0, 3).join(', ')} and nearby areas.`
  const faq = buildFaq(city)
  const ldJson = JSON.stringify(cityStructuredData({ city, canonical, ogImage, faq }))
  const otherCities = SERVICE_CITIES.filter((c) => c.slug !== city.slug)
  const seoHighlights = Array.isArray(city.seoHighlights) ? city.seoHighlights : []
  const cityIntro = city.seoIntro || `PhysiOkhom provides local home physiotherapy coverage across ${city.name} and nearby areas.`
  const localityLinks = city.neighborhoods.slice(0, 8).map((name) => ({
    name,
    slug: String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
  }))

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PhysiOkhom" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{ldJson}</script>
      </Helmet>

      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-mesh-hero">
          <div className="pointer-events-none absolute inset-0 bg-grid-saas opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-20 lg:pt-24">
            <nav aria-label="Breadcrumb" className="mb-6 text-xs font-medium text-slate-500">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-slate-700">Home</Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-slate-700">Physiotherapist in {city.name}</li>
              </ol>
            </nav>
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur">
                Home visits in {city.name}
              </p>
              <h1 className="type-hero mt-6 text-balance sm:leading-[1.08]">
                Physiotherapist in {city.name} — home visit physiotherapist near you
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
                {city.tagline} PhysiOkhom matches you with a licensed, verified physiotherapist who does home visits in {city.name}, {city.state}, for back pain, knee pain, post-surgery rehab, stroke recovery and more.
              </p>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{cityIntro}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  className="interactive-press inline-flex h-12 items-center justify-center rounded-xl bg-teal-600 px-8 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors duration-200 hover:bg-teal-700"
                >
                  Book a home visit physiotherapist
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                >
                  Create a free account
                </Link>
              </div>
              {seoHighlights.length ? (
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Popular local searches">
                  {seoHighlights.map((term) => (
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

        <section className="border-b border-slate-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="type-page-title">
                Home visit physiotherapy in {city.name}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-500">
                Whether you are recovering from surgery, managing chronic back pain, or supporting an elder at home, a
                qualified physiotherapist can come to your door in {city.name}. Skip the commute, avoid clinic queues,
                and get focused one-on-one care at a time that works for you.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TREATMENTS.map((t) => (
                <Link
                  key={t.title}
                  to={`/physio-in/${city.slug}/${t.slug}`}
                  className="group rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.025] transition hover:border-teal-300 hover:shadow-md"
                >
                  <h3 className="text-[17px] font-semibold tracking-tight text-slate-900 group-hover:text-teal-700">{t.title} in {city.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.blurb}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-teal-700">
                    {t.title} physiotherapy in {city.name} →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">
              Neighborhoods we cover in {city.name}
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-500">
              Our home visit physiotherapists operate across {city.name}. Share your address when you book and we
              assign the closest available clinician.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {city.neighborhoods.map((n) => (
                <li
                  key={n}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                >
                  Physiotherapist in {n}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="type-page-title text-slate-900">
                Locality searches in {city.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                If you are searching terms like &quot;physiotherapist near me&quot; for a specific area, use these locality
                links:
              </p>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {localityLinks.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      to={`/near-me-physio/${city.slug}/${entry.slug}`}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                    >
                      Physiotherapist near {entry.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to={`/near-me-physio/${city.slug}`}
                className="mt-4 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                View full near-me guide for {city.name} →
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">
              Frequently asked questions — physiotherapist in {city.name}
            </h2>
            <dl className="mt-10 space-y-8">
              {faq.map(({ q, a }) => (
                <div key={q} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                  <dt className="type-page-title text-slate-900">{q}</dt>
                  <dd className="mt-2 text-base leading-relaxed text-slate-600">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">Home visit physiotherapist in other cities</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
              PhysiOkhom connects patients with verified physiotherapists across Assam service cities.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/physio-in/${c.slug}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
                  >
                    Physiotherapist in {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="type-page-title">
              Book a physiotherapist at home in {city.name}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-slate-500">
              Pick a slot, share your {city.name} address, and pay online to confirm. Your verified physiotherapist will arrive
              at your door.
            </p>
            <div className="mt-10">
              <Link
                to="/book"
                className="interactive-press inline-flex h-12 items-center justify-center rounded-xl bg-teal-600 px-10 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors duration-200 hover:bg-teal-700"
              >
                Book appointment
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold">PhysiOkhom</p>
            <p className="mt-2 text-sm text-white/60">&copy; {new Date().getFullYear()} Home visit physiotherapy in {city.name}.</p>
          </div>
          <nav className="flex flex-col gap-3 text-sm font-medium sm:items-end" aria-label="Footer">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/90">
              <Link to="/" className="transition-colors hover:text-white">Home</Link>
              <Link to="/register" className="transition-colors hover:text-white">Create account</Link>
              <Link to="/login" className="transition-colors hover:text-white">Sign in</Link>
              <Link to="/book" className="transition-colors hover:text-white">Book a physiotherapist</Link>
              <Link to="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</Link>
            </div>
            <Link to="/register-physio" className="text-white/90 transition-colors duration-200 hover:text-white">
              Register as a physiotherapist →
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
