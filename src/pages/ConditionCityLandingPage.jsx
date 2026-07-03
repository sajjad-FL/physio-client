import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SiteHeader from '../components/layout/SiteHeader'
import { SERVICE_CITIES, findCityBySlug } from '../constants/serviceCities'
import { CONDITIONS, findConditionBySlug } from '../constants/conditions'
import { absoluteUrl, siteOrigin } from '../utils/siteMeta'

function buildFaq(city, condition) {
  const lc = condition.name.toLowerCase()
  return [
    {
      q: `Where can I get ${lc} physiotherapy at home in ${city.name}?`,
      a: `PhysiOkhom matches you with a verified physiotherapist who does home visits across ${city.name}, ${city.state}, including ${city.neighborhoods.slice(0, 4).join(', ')} and nearby areas. Pick a slot, share your address, and a clinician comes to your door.`,
    },
    ...condition.faq,
    {
      q: `Are the physiotherapists treating ${lc} in ${city.name} verified?`,
      a: `Yes. Every clinician marked as verified has completed our platform checks, including qualification and ID verification. You can read reviews on each physiotherapist's public profile before you book.`,
    },
    {
      q: `How much does ${lc} home physiotherapy cost in ${city.name}?`,
      a: `Fees vary by physiotherapist, experience level and session length. You see the per-session price before you confirm the booking — no hidden charges and secure online payment.`,
    },
  ]
}

function structuredData({ city, condition, canonical, ogImage, faq }) {
  const siteBase = (siteOrigin() || 'https://physiokhom.com').replace(/\/$/, '')
  const cityUrl = `${siteBase}/physio-in/${city.slug}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalBusiness',
        '@id': `${canonical}#organization`,
        name: `PhysiOkhom — ${condition.label} in ${city.name}`,
        url: canonical,
        image: ogImage,
        description: `Book a verified home visit physiotherapist for ${condition.name.toLowerCase()} in ${city.name}, ${city.state}. ${condition.intro}`,
        medicalSpecialty: 'Physiotherapy',
        priceRange: '₹₹',
        address: {
          '@type': 'PostalAddress',
          addressLocality: city.name,
          addressRegion: city.state,
          addressCountry: 'IN',
        },
        areaServed: {
          '@type': 'City',
          name: city.name,
          containedInPlace: { '@type': 'AdministrativeArea', name: city.state },
          ...(typeof city.lat === 'number' && typeof city.lng === 'number'
            ? { geo: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng } }
            : {}),
        },
        availableService: {
          '@type': 'MedicalTherapy',
          name: `${condition.label} in ${city.name}`,
        },
      },
      {
        '@type': 'MedicalCondition',
        '@id': `${canonical}#condition`,
        name: condition.name,
        possibleTreatment: {
          '@type': 'MedicalTherapy',
          name: `${condition.label} (home visit) in ${city.name}`,
        },
        signOrSymptom: condition.symptoms.map((s) => ({
          '@type': 'MedicalSignOrSymptom',
          name: s,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteBase}/` },
          { '@type': 'ListItem', position: 2, name: `Physiotherapist in ${city.name}`, item: cityUrl },
          { '@type': 'ListItem', position: 3, name: `${condition.name} in ${city.name}`, item: canonical },
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

export default function ConditionCityLandingPage() {
  const { city: citySlug, condition: conditionSlug } = useParams()
  const city = useMemo(() => findCityBySlug(citySlug), [citySlug])
  const condition = useMemo(() => findConditionBySlug(conditionSlug), [conditionSlug])

  // Invalid city → home; valid city but unknown condition → the city hub page.
  if (!city) return <Navigate to="/" replace />
  if (!condition) return <Navigate to={`/physio-in/${city.slug}`} replace />

  const lc = condition.name.toLowerCase()
  const canonical = absoluteUrl(`/physio-in/${city.slug}/${condition.slug}`)
  const ogImage = absoluteUrl('/og-default.png')
  const title = `${condition.label} in ${city.name}, ${city.state} — Home Visit | PhysiOkhom`
  const description = `Looking for ${lc} physiotherapy in ${city.name}, ${city.state}? PhysiOkhom sends a verified home visit physiotherapist to your door — serving ${city.neighborhoods
    .slice(0, 3)
    .join(', ')} and nearby areas. Book online in minutes.`
  const faq = buildFaq(city, condition)
  const ldJson = JSON.stringify(structuredData({ city, condition, canonical, ogImage, faq }))

  const otherConditions = CONDITIONS.filter((c) => c.slug !== condition.slug)
  const otherCities = SERVICE_CITIES.filter((c) => c.slug !== city.slug)

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
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-mesh-hero">
          <div className="pointer-events-none absolute inset-0 bg-grid-saas opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-20 lg:pt-24">
            <nav aria-label="Breadcrumb" className="mb-6 text-xs font-medium text-slate-500">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-slate-700">Home</Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link to={`/physio-in/${city.slug}`} className="hover:text-slate-700">
                    Physiotherapist in {city.name}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-slate-700">{condition.name}</li>
              </ol>
            </nav>
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur">
                Home visits in {city.name}
              </p>
              <h1 className="type-hero mt-6 text-balance sm:leading-[1.08]">
                {condition.label} in {city.name} — home visit physiotherapist near you
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">{condition.intro}</p>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
                PhysiOkhom matches you with a licensed, verified physiotherapist who treats {lc} at
                home across {city.name}, {city.state}.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  state={{ selectedIssue: condition.bookingIssue }}
                  className="interactive-press inline-flex h-12 items-center justify-center rounded-xl bg-teal-600 px-8 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors duration-200 hover:bg-teal-700"
                >
                  Book a {lc} physiotherapist
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                >
                  Create a free account
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Popular local searches">
                {condition.searchTerms.map((term) => (
                  <li
                    key={term}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {term} in {city.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Symptoms */}
        <section className="border-b border-slate-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="type-page-title">Signs you may need {lc} physiotherapy</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-500">
                If any of these sound familiar, a home visit physiotherapist in {city.name} can
                assess you and start treatment without a clinic trip.
              </p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {condition.symptoms.map((s) => (
                <li
                  key={s}
                  className="flex gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.025]"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" aria-hidden />
                  <span className="text-[15px] leading-relaxed text-slate-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Causes + approach */}
        <section className="border-b border-slate-200 bg-slate-50 py-16 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="type-page-title">Common causes of {lc}</h2>
              <ul className="mt-6 space-y-3">
                {condition.causes.map((c) => (
                  <li key={c} className="flex gap-3 text-base leading-relaxed text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="type-page-title">How our home physiotherapy treats it</h2>
              <p className="mt-6 text-base leading-relaxed text-slate-600">{condition.approach}</p>
              <Link
                to="/book"
                state={{ selectedIssue: condition.bookingIssue }}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700"
              >
                Book a home visit in {city.name}
              </Link>
            </div>
          </div>
        </section>

        {/* Neighborhoods */}
        <section className="border-b border-slate-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">{condition.name} physiotherapy across {city.name}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-500">
              Our physiotherapists visit homes throughout {city.name}. Share your address when you
              book and we assign the closest available clinician.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {city.neighborhoods.map((n) => (
                <li
                  key={n}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                >
                  {condition.name} physiotherapy in {n}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-slate-200 bg-slate-50 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">
              {condition.name} physiotherapy in {city.name} — FAQs
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

        {/* Internal links: other conditions in this city */}
        <section className="border-b border-slate-200 bg-white py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">Other home physiotherapy services in {city.name}</h2>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {otherConditions.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/physio-in/${city.slug}/${c.slug}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
                  >
                    {c.name} in {city.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to={`/physio-in/${city.slug}`}
              className="mt-6 inline-block text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              See all physiotherapy in {city.name} →
            </Link>
          </div>
        </section>

        {/* Internal links: same condition in other cities */}
        <section className="border-b border-slate-200 bg-slate-50 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="type-page-title">{condition.label} in other cities</h2>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/physio-in/${c.slug}/${condition.slug}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
                  >
                    {condition.name} in {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="type-page-title">Book {lc} physiotherapy at home in {city.name}</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-slate-500">
              Pick a slot, share your {city.name} address, and pay online to confirm. Your verified
              physiotherapist will arrive at your door.
            </p>
            <div className="mt-10">
              <Link
                to="/book"
                state={{ selectedIssue: condition.bookingIssue }}
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
            <p className="mt-2 text-sm text-white/60">
              &copy; {new Date().getFullYear()} {condition.label} in {city.name}.
            </p>
          </div>
          <nav className="flex flex-col gap-3 text-sm font-medium sm:items-end" aria-label="Footer">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/90">
              <Link to="/" className="transition-colors hover:text-white">Home</Link>
              <Link to={`/physio-in/${city.slug}`} className="transition-colors hover:text-white">
                Physiotherapist in {city.name}
              </Link>
              <Link to="/register" className="transition-colors hover:text-white">Create account</Link>
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
