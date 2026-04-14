import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Bandage, Brain, Footprints, MessageCircleQuestion, PersonStanding } from 'lucide-react'
import { ISSUE_OPTIONS } from '../constants/issues'
import SiteHeader from '../components/layout/SiteHeader'
import FeaturedPhysiosSection from '../components/home/FeaturedPhysiosSection'

function serviceBlurb(title) {
  if (title === 'Post Surgery Rehab') return 'Guided recovery at home after your procedure.'
  if (title === 'Stroke/Paralysis')
    return 'Rehabilitation, mobility, and daily-life support after stroke or paralysis.'
  return `Focused care and exercises for ${title.toLowerCase()}.`
}

/** Marketing tiles: catalogue + “Other” (shown in a single scrollable row on home). */
const services = [
  ...ISSUE_OPTIONS.map((title) => ({ title, blurb: serviceBlurb(title) })),
  {
    title: 'Other condition',
    blurb: 'Something else entirely? When you book, pick “Other” and describe your concern — we’ll match you carefully.',
  },
]

const serviceCardDelays = ['animate-delay-2', 'animate-delay-3', 'animate-delay-4', 'animate-delay-5']

const iconStroke = 1.75

function ServiceConditionIcon({ title }) {
  const cn = 'h-[22px] w-[22px] shrink-0'
  switch (title) {
    case 'Back Pain':
      return <Activity className={cn} strokeWidth={iconStroke} aria-hidden />
    case 'Neck Pain':
      return <PersonStanding className={cn} strokeWidth={iconStroke} aria-hidden />
    case 'Knee Pain':
      return <Footprints className={cn} strokeWidth={iconStroke} aria-hidden />
    case 'Post Surgery Rehab':
      return <Bandage className={cn} strokeWidth={iconStroke} aria-hidden />
    case 'Stroke/Paralysis':
      return <Brain className={cn} strokeWidth={iconStroke} aria-hidden />
    case 'Other condition':
      return <MessageCircleQuestion className={cn} strokeWidth={iconStroke} aria-hidden />
    default:
      return <Activity className={cn} strokeWidth={iconStroke} aria-hidden />
  }
}

function ChevronLeft({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  )
}

function ChevronRight({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M8.25 4.5L15.75 12l-7.5 7.5"
      />
    </svg>
  )
}

/** Single-row strip with hidden scrollbar and arrow controls (carousel-style). */
function ServicesConditionsCarousel() {
  const scrollerRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const measureStep = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return 300
    const flex = el.firstElementChild
    const card = flex?.querySelector('[data-service-card]')
    if (!card || !flex) return 300
    const gapStr = getComputedStyle(flex).gap || '16px'
    const gap = parseFloat(gapStr) || 16
    return card.getBoundingClientRect().width + gap
  }, [])

  const updateState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
    setCanPrev(scrollLeft > 4)
    setCanNext(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateState()
    el.addEventListener('scroll', updateState, { passive: true })
    const ro = new ResizeObserver(updateState)
    ro.observe(el)
    window.addEventListener('resize', updateState)
    return () => {
      el.removeEventListener('scroll', updateState)
      ro.disconnect()
      window.removeEventListener('resize', updateState)
    }
  }, [updateState])

  const scrollByDir = useCallback((dir) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * measureStep(), behavior: 'smooth' })
  }, [measureStep])

  const navGhost =
    'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent text-slate-500/40 shadow-none ring-0 transition sm:h-11 sm:w-11 ' +
    'group-hover/carousel:bg-white/35 group-hover/carousel:text-slate-600/85 ' +
    'hover:bg-white/60 hover:text-teal-900 hover:shadow-sm motion-reduce:transition-none ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ' +
    'disabled:pointer-events-none disabled:opacity-0'

  return (
    <div className="group/carousel relative mt-10 sm:mt-12">
      <button
        type="button"
        aria-label="Previous conditions"
        disabled={!canPrev}
        onClick={() => scrollByDir(-1)}
        className={`${navGhost} left-0 sm:left-0.5`}
      >
        <ChevronLeft className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
      </button>
      <button
        type="button"
        aria-label="Next conditions"
        disabled={!canNext}
        onClick={() => scrollByDir(1)}
        className={`${navGhost} right-0 sm:right-0.5`}
      >
        <ChevronRight className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
      </button>

      <div
        ref={scrollerRef}
        className="w-full min-w-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Conditions we treat"
        aria-roledescription="carousel"
      >
        <div className="flex flex-nowrap gap-3.5 sm:gap-5">
          {services.map((s, i) => (
            <div
              key={s.title}
              data-service-card
              className={
                'interactive-lift group w-[min(272px,82vw)] max-w-[300px] min-w-[232px] shrink-0 snap-start rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.025] motion-safe:animate-enter-up sm:p-6 ' +
                'hover:border-slate-300/90 hover:shadow-md hover:ring-slate-900/[0.04] ' +
                serviceCardDelays[i % serviceCardDelays.length]
              }
            >
              <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50/80 text-teal-700 shadow-sm ring-1 ring-teal-100/70 transition-all duration-300 ease-out group-hover:from-teal-600 group-hover:to-teal-600 group-hover:text-white group-hover:ring-teal-600/40">
                <ServiceConditionIcon title={s.title} />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const steps = [
  { title: 'Book', text: 'Share your details and what you need help with.' },
  { title: 'Get assigned', text: 'We match you with a qualified physiotherapist.' },
  { title: 'Get treatment', text: 'Receive expert therapy in the comfort of your home.' },
]

const flowSteps = ['Choose slot', 'Confirm details', 'Pay securely']
const flowCopy = [
  'Pick a date that works for you.',
  'Tell us what you need help with.',
  'Razorpay checkout — then we assign a physio.',
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-mesh-hero">
          <div className="pointer-events-none absolute inset-0 bg-grid-saas opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="motion-safe:animate-enter inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur">
                Home visits · Verified clinicians
              </p>
              <h1 className="motion-safe:animate-enter-up animate-delay-1 mt-8 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.08]">
                Find Trusted Physiotherapists Near You
              </h1>
              <p className="motion-safe:animate-enter-up animate-delay-2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
                Expert care for back pain, knee pain, and recovery — without the clinic commute. Simple booking, secure
                payment, and a therapist matched to your area.
              </p>
              <div className="motion-safe:animate-enter-up animate-delay-3 mt-12 flex flex-col items-center justify-center">
                <Link
                  to="/book"
                  className="interactive-press inline-flex h-12 min-w-[10rem] items-center justify-center rounded-xl bg-teal-600 px-8 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors duration-200 hover:bg-teal-700"
                >
                  Book Now
                </Link>
              </div>
              <p className="motion-safe:animate-enter-up animate-delay-4 mt-6">
                <a
                  href="#how-it-works"
                  className="text-sm font-medium text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline"
                >
                  How it works
                </a>
              </p>
            </div>

            <div className="motion-safe:animate-enter-up animate-delay-5 mx-auto mt-20 max-w-4xl lg:mt-24">
              <div className="surface-card rounded-2xl p-2.5 ring-1 ring-slate-900/5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-5 py-3.5 text-sm text-slate-500">
                  <span className="font-medium text-slate-900">Today&apos;s flow</span>
                  <span className="rounded-lg bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                    OTP → slot → pay
                  </span>
                </div>
                <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
                  {flowSteps.map((label, i) => (
                    <div key={label} className="bg-white px-6 py-7 transition-colors duration-200 sm:py-8">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{String(i + 1).padStart(2, '0')}</p>
                      <p className="mt-3 text-[15px] font-semibold text-slate-900">{label}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{flowCopy[i]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="border-b border-slate-200 bg-white py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">What we help with</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-500">
                Common conditions our physiotherapists treat during home visits.
              </p>
            </div>
            <ServicesConditionsCarousel />
          </div>
        </section>

        <section id="how-it-works" className="bg-grid-saas py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg leading-relaxed text-slate-500">
              Three calm steps from request to treatment.
            </p>
            <div className="mt-16 grid gap-5 sm:gap-6 md:grid-cols-3 md:gap-8">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className={
                    'surface-card relative rounded-2xl p-8 md:p-9 motion-safe:animate-enter-up ' +
                    ['animate-delay-1', 'animate-delay-2', 'animate-delay-3'][i]
                  }
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-6 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FeaturedPhysiosSection />

        <section id="book" className="border-t border-slate-200 bg-white py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Ready to book?</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-slate-500">
              Sign in with your phone, pick a slot, and pay to confirm — we&apos;ll handle the rest.
            </p>
            <div className="mt-12">
              <Link
                to="/book"
                className="interactive-press inline-flex h-12 items-center justify-center rounded-xl bg-teal-600 px-10 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors duration-200 hover:bg-teal-700"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 py-14 sm:flex-row sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold">NearbyPhysio</p>
            <p className="mt-2 text-sm text-white/60">&copy; {new Date().getFullYear()} Home visit physiotherapy.</p>
          </div>
          <Link
            to="/register-physio"
            className="text-sm font-medium text-white/90 transition-colors duration-200 hover:text-white"
          >
            Register as a physio →
          </Link>
        </div>
      </footer>
    </div>
  )
}
