import { useLayoutEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTechniqueBySlug } from '../constants/techniques'
import { usePricingSettings } from '../hooks/usePricingSettings'
import SeoNoIndex from '../components/seo/SeoNoIndex'
import Button from '../components/ui/Button'

function StepIcon({ n, color }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {n}
    </span>
  )
}

export default function TechniqueDetailPage() {
  const { slug } = useParams()
  const tech = getTechniqueBySlug(slug)
  const { settings, loading } = usePricingSettings()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [slug])

  if (!tech) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <SeoNoIndex />
        <p className="text-sm text-slate-600">Technique not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-teal-700">
          ← Back to home
        </Link>
      </div>
    )
  }

  const price = Number(settings?.techniquePrices?.[tech.bookingIssue])
  const priceLabel =
    Number.isFinite(price) && price > 0
      ? `₹${price.toLocaleString('en-IN')}`
      : loading
        ? '…'
        : '—'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <SeoNoIndex />

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-teal-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Book by Need
          </Link>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: tech.bg, color: tech.color }}
          >
            Home visit
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-3xl border shadow-sm"
          style={{ borderColor: tech.border, backgroundColor: '#fff' }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ backgroundColor: tech.color }}
          />
          <div className="relative grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-center sm:p-8">
            <div
              className="flex w-full items-center justify-center rounded-2xl px-2 py-4 sm:min-h-[200px] sm:px-0 sm:py-0"
              style={{ background: `linear-gradient(145deg, ${tech.bg} 0%, #ffffff 100%)` }}
            >
              <img
                src={tech.image}
                alt=""
                className="h-56 w-full max-h-64 object-contain drop-shadow-md sm:h-44 sm:w-44 sm:max-h-none"
              />
            </div>
            <div className="min-w-0">
              <h1 className="type-page-title text-slate-900">{tech.label}</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{tech.intro}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {['Home visit', 'Physio assigned after booking', 'Pay at visit or online'].map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Price card */}
        <section
          className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:p-6"
          style={{ borderColor: tech.border }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Session price</p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight" style={{ color: tech.color }}>
              {priceLabel}
            </p>
            <p className="mt-1 text-xs text-slate-500">One home session · price set by platform</p>
          </div>
          <Link to={`/techniques/${tech.slug}/book`} className="hidden sm:block">
            <Button type="button" className="min-w-[140px] px-6">
              Book now
            </Button>
          </Link>
        </section>

        {/* What to expect */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">What to expect</h2>
          <ol className="relative mt-4 space-y-0">
            {tech.expect.map((line, i) => (
              <li key={line} className="relative flex gap-4 pb-6 last:pb-0">
                {i < tech.expect.length - 1 ? (
                  <span
                    className="absolute left-4 top-9 bottom-0 w-px bg-slate-200"
                    aria-hidden
                  />
                ) : null}
                <StepIcon n={i + 1} color={tech.color} />
                <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm">
                  <p className="text-sm leading-relaxed text-slate-700">{line}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        {tech.faq?.length ? (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Common questions</h2>
            <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              {tech.faq.map((item) => (
                <div key={item.q} className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">{item.q}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{tech.label}</p>
            <p className="text-xs text-slate-500">{priceLabel} · home visit</p>
          </div>
          <Link to={`/techniques/${tech.slug}/book`}>
            <Button type="button">Book now</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
