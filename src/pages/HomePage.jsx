import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ShieldCheck,
  Home,
  CreditCard,
  MapPin,
  Star,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Users,
  Activity,
  Search,
  MessageSquare,
  HelpCircle,
  Stethoscope,
  HeartPulse,
  Sparkles,
  BadgeCheck,
} from 'lucide-react'
import { ISSUE_OPTIONS } from '../constants/issues'
import { SERVICE_CITIES } from '../constants/serviceCities'
import SiteHeader from '../components/layout/SiteHeader'
import FeaturedPhysiosSection from '../components/home/FeaturedPhysiosSection'
import {
  BackPainIllustration,
  NeckPainIllustration,
  KneePainIllustration,
  RehabIllustration,
  StrokeIllustration,
  OtherConditionIllustration,
} from '../components/home/ConditionIllustrations'
import { absoluteUrl, primaryServiceAreas, primaryServiceAreasSentence, siteOrigin } from '../utils/siteMeta'

/* ─── SEO ──────────────────────────────────────────────────────────────── */

const HOME_TITLE = 'Physio Near Me in Assam | Home Visit Physiotherapy — PhysioKhom'
const HOME_DESCRIPTION =
  'Looking for a physio near you in Assam? PhysioKhom connects patients with verified home visit physiotherapists in Guwahati, Barpeta, Bongaigaon, Bijni, and Kokrajhar for back pain, knee pain, post-surgery rehab, and stroke recovery.'

const HOME_FAQ = [
  {
    q: 'How do I find a physiotherapist near me?',
    a: 'PhysioKhom lists verified physiotherapists you can book for home visits. Create an account, share your location when you book, and we match you with an available clinician for your time slot.',
  },
  {
    q: 'Is this physio at home or in a clinic?',
    a: 'Our focus is home visit physiotherapy so you can recover where you are comfortable, without the clinic commute.',
  },
  {
    q: 'Are therapists verified?',
    a: 'Profiles marked as verified have completed our platform checks. You can read reviews on individual physiotherapist pages before you book.',
  },
  {
    q: 'How does booking work?',
    a: 'You choose a date and time slot, pay online to confirm, and our team assigns a qualified physiotherapist. You can track your booking in your dashboard.',
  },
  {
    q: 'What conditions do you help with?',
    a: 'Common examples include back pain, neck pain, knee pain, post-surgery rehabilitation, and stroke or paralysis support — plus other issues you can describe when booking.',
  },
]

function homeStructuredData({ siteBase, ogImage, areas }) {
  const cityAreas = SERVICE_CITIES.map((c) => ({
    '@type': 'City',
    name: c.name,
    containedInPlace: { '@type': 'AdministrativeArea', name: c.state },
  }))
  const envAreas = areas
    .filter((name) => !SERVICE_CITIES.some((c) => c.name.toLowerCase() === name.toLowerCase()))
    .map((name) => ({ '@type': 'AdministrativeArea', name }))
  const areaServed = [...cityAreas, ...envAreas]
  const faqEntity = HOME_FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  }))
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${siteBase}/#website`,
      name: 'PhysioKhom',
      url: `${siteBase}/`,
      inLanguage: 'en-IN',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${siteBase}/book?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'MedicalBusiness',
      '@id': `${siteBase}/#organization`,
      name: 'PhysioKhom',
      url: `${siteBase}/`,
      description: HOME_DESCRIPTION,
      image: ogImage,
      medicalSpecialty: 'Physiotherapy',
      priceRange: '₹₹',
      address: { '@type': 'PostalAddress', addressRegion: 'Assam', addressCountry: 'IN' },
      ...(areaServed.length ? { areaServed } : {}),
      availableService: [
        { '@type': 'MedicalTherapy', name: 'Back pain physiotherapy' },
        { '@type': 'MedicalTherapy', name: 'Knee pain physiotherapy' },
        { '@type': 'MedicalTherapy', name: 'Neck pain physiotherapy' },
        { '@type': 'MedicalTherapy', name: 'Post-surgery rehabilitation' },
        { '@type': 'MedicalTherapy', name: 'Stroke and paralysis rehabilitation' },
      ],
    },
    { '@type': 'FAQPage', '@id': `${siteBase}/#faq`, mainEntity: faqEntity },
  ]
  return { '@context': 'https://schema.org', '@graph': graph }
}

/* ─── Design data ───────────────────────────────────────────────────────── */

const STAT_PILLS = [
  { Icon: CheckCircle2, label: '500+ Sessions' },
  { Icon: BadgeCheck, label: 'Verified Physios' },
  { Icon: MapPin, label: 'Across Assam' },
]

const HOW_STEPS = [
  {
    Icon: Search,
    title: 'Book online',
    desc: 'Choose a date, share your concern, and confirm your slot in minutes.',
  },
  {
    Icon: Users,
    title: 'Get matched',
    desc: 'We connect you with a verified home-visit physiotherapist near you.',
  },
  {
    Icon: Home,
    title: 'Recover at home',
    desc: 'Receive expert care at home on a schedule that works for you.',
  },
]

const WHY_FEATURES = [
  {
    Icon: ShieldCheck,
    title: 'Certified Physiotherapists',
    desc: 'Every physio is a licensed BPT/MPT graduate, background-verified before joining.',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
  },
  {
    Icon: Home,
    title: 'Home Visits Only',
    desc: 'Sessions happen at your home — no travel, no waiting rooms, no hassle.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    Icon: CreditCard,
    title: 'Flexible Payment',
    desc: 'Pay per session or in packages. Easy online payment via Razorpay.',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
  },
]

const CONDITION_CONFIG = {
  'Back Pain':          { Illustration: BackPainIllustration  },
  'Neck Pain':          { Illustration: NeckPainIllustration  },
  'Knee Pain':          { Illustration: KneePainIllustration  },
  'Post Surgery Rehab': { Illustration: RehabIllustration     },
  'Stroke/Paralysis':   { Illustration: StrokeIllustration    },
}

const CONDITIONS_WITH_OTHER = [
  ...ISSUE_OPTIONS,
  'Other condition',
]

/* ─── Small components ──────────────────────────────────────────────────── */

function SectionLabel({ Icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-teal-50">
        <Icon size={13} className="text-teal-600" />
      </div>
      <span className="text-sm font-bold text-slate-900">{children}</span>
    </div>
  )
}

function SectionHeading({ label, labelIcon, title, subtitle, center = false }) {
  return (
    <div className={center ? 'text-center' : ''}>
      {label && (
        <div className={`mb-4 ${center ? 'flex justify-center' : ''}`}>
          <SectionLabel Icon={labelIcon}>{label}</SectionLabel>
        </div>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className={`mt-4 text-lg leading-relaxed text-slate-500 ${center ? 'mx-auto max-w-2xl' : 'max-w-xl'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function FaqItem({ q, a, open, onToggle }) {
  const bodyRef = useRef(null)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 py-5 text-left transition-colors hover:text-teal-700"
        aria-expanded={open}
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 transition-colors">
          <ChevronDown
            size={13}
            className={`text-teal-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </span>
        <span className="flex-1 text-[15px] font-semibold text-slate-900">{q}</span>
      </button>
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 500) + 'px' : '0px' }}
      >
        <p className="pb-5 pl-10 text-[15px] leading-relaxed text-slate-600">{a}</p>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const siteBase = (siteOrigin() || 'http://localhost:5173').replace(/\/$/, '')
  const canonical = absoluteUrl('/')
  const ogImage = absoluteUrl('/og-default.png')
  const areaLine = primaryServiceAreasSentence()
  const ldJson = JSON.stringify(homeStructuredData({ siteBase, ogImage, areas: primaryServiceAreas() }))

  const [openFaq, setOpenFaq] = useState(null)

  function toggleFaq(i) {
    setOpenFaq((prev) => (prev === i ? null : i))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{HOME_TITLE}</title>
        <meta name="description" content={HOME_DESCRIPTION} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PhysioKhom" />
        <meta property="og:title" content={HOME_TITLE} />
        <meta property="og:description" content={HOME_DESCRIPTION} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={HOME_TITLE} />
        <meta name="twitter:description" content={HOME_DESCRIPTION} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{ldJson}</script>
      </Helmet>

      <SiteHeader />

      <main>
        {/* ══════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-teal-600">
          {/* Glow orbs */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-72 w-72 rounded-full bg-white/7" aria-hidden />
          <div className="pointer-events-none absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-white/5" aria-hidden />
          <div className="pointer-events-none absolute top-1/3 -left-8 h-40 w-40 rounded-full bg-white/4" aria-hidden />

          <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pt-24">
            {/* Trust badge */}
            <div className="motion-safe:animate-enter inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              <ShieldCheck size={12} />
              Verified home care · Assam
            </div>

            {/* H1 */}
            <h1 className="motion-safe:animate-enter-up animate-delay-1 mt-6 text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl sm:leading-[1.05] lg:text-[62px]">
              Expert home physio,{' '}
              <br className="hidden sm:block" />
              right at your door
            </h1>

            {/* Stats pills */}
            <div className="motion-safe:animate-enter-up animate-delay-2 mt-8 flex flex-wrap items-center justify-center gap-3">
              {STAT_PILLS.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white/92 backdrop-blur-sm"
                >
                  <Icon size={11} className="text-white/80" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* White card that overlaps the hero and contains description + CTA */}
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="motion-safe:animate-enter-up animate-delay-3 overflow-hidden rounded-t-3xl bg-white px-6 py-8 shadow-xl sm:px-10 sm:py-10">
              <p className="text-center text-[17px] leading-relaxed text-slate-500">
                PhysioKhom connects patients with verified home-visit physiotherapists for back pain, knee pain,
                post-surgery rehab, stroke recovery, and more.
                {areaLine ? (
                  <>
                    {' '}
                    Currently serving <span className="font-semibold text-slate-700">{areaLine}</span>.
                  </>
                ) : null}
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  to="/book"
                  className="interactive-press inline-flex h-12 items-center gap-2 rounded-xl bg-teal-600 px-8 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors hover:bg-teal-700"
                >
                  Book a session
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-7 text-[15px] font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
                >
                  Sign in
                </Link>
              </div>

              <p className="mt-5 text-center text-sm text-slate-400">
                New here?{' '}
                <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800">
                  Create a free account →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* White band continuation below hero card */}
        <div className="bg-white">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="h-8 sm:h-10" />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="border-y border-slate-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={Sparkles}
              label="Simple process"
              title="How it works"
              subtitle="Three calm steps from request to treatment at your doorstep."
              center
            />

            <div className="mt-14 grid gap-5 sm:gap-6 md:grid-cols-3 md:gap-8">
              {HOW_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className={
                    'surface-card group relative rounded-2xl p-8 motion-safe:animate-enter-up ' +
                    ['animate-delay-1', 'animate-delay-2', 'animate-delay-3'][i]
                  }
                >
                  {/* connector line on desktop */}
                  {i < HOW_STEPS.length - 1 && (
                    <div
                      className="absolute top-[2.6rem] -right-4 hidden h-0.5 w-8 bg-teal-100 md:block"
                      aria-hidden
                    />
                  )}
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white shadow-md shadow-teal-600/25">
                      {i + 1}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                      <step.Icon size={16} className="text-teal-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            WHY PHYSIOKKHOM
        ══════════════════════════════════════════════════════════════ */}
        <section id="why" className="bg-slate-50 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
              <SectionHeading
                labelIcon={Star}
                label="Why PhysioKhom"
                title="Professional care, delivered at home"
                subtitle="We handle the logistics so you can focus entirely on recovery — no commute, no scheduling headaches."
              />

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {WHY_FEATURES.map((f, i) => (
                  <div key={f.title}>
                    <div className="flex items-start gap-4 p-6">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${f.iconBg}`}
                      >
                        <f.Icon size={20} className={f.iconColor} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-slate-900">{f.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                      </div>
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-500" />
                    </div>
                    {i < WHY_FEATURES.length - 1 && (
                      <div className="mx-6 border-b border-slate-100" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CONDITIONS WE TREAT
        ══════════════════════════════════════════════════════════════ */}
        <section id="services" className="border-y border-slate-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={Stethoscope}
              label="Common conditions"
              title="What we help with"
              subtitle="Our physiotherapists treat a wide range of conditions during home visits."
              center
            />

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {CONDITIONS_WITH_OTHER.map((title) => {
                const { Illustration } = CONDITION_CONFIG[title] ?? { Illustration: OtherConditionIllustration }
                return (
                  <div
                    key={title}
                    className="interactive-lift group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="aspect-4/3 w-full overflow-hidden">
                      <Illustration className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]" />
                    </div>
                    <div className="border-t border-slate-100 px-4 py-3 text-center">
                      <p className="text-[13px] font-semibold text-slate-800">{title}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/book"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Book for any condition
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FEATURED PHYSIOS (existing section)
        ══════════════════════════════════════════════════════════════ */}
        <FeaturedPhysiosSection />

        {/* ══════════════════════════════════════════════════════════════
            TESTIMONIAL
        ══════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={MessageSquare}
              label="What patients say"
              title="Trusted by patients across Assam"
              center
            />

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: 'Priya Bora',
                  location: 'Guwahati, Assam',
                  text: 'My recovery after knee surgery was much faster thanks to regular home physio sessions. The physiotherapist was professional, punctual, and very caring. Highly recommended!',
                  initials: 'PB',
                  rating: 5,
                },
                {
                  name: 'Rajan Das',
                  location: 'Bongaigaon, Assam',
                  text: 'Had chronic back pain for months. Two weeks of home visits and I can finally sit at my desk without discomfort. The convenience of home visits is unmatched.',
                  initials: 'RD',
                  rating: 5,
                },
                {
                  name: 'Anita Kalita',
                  location: 'Barpeta, Assam',
                  text: 'My father had a stroke and needed daily physiotherapy. PhysioKhom made it possible for him to recover at home, which made a huge difference in his morale.',
                  initials: 'AK',
                  rating: 5,
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="surface-card flex flex-col gap-4 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                      {t.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.location}</p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-slate-600 italic">"{t.text}"</p>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-teal-600" />
                    <span className="text-xs font-medium text-teal-700">Verified patient</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            JOIN AS PHYSIO BANNER
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-teal-50 py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Link
              to="/register-physio"
              className="interactive-lift flex items-center gap-5 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md sm:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <HeartPulse size={22} className="text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-slate-900">
                  Are you a physiotherapist?
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Join PhysioKhom — list your practice and take flexible home-visit appointments.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-sm font-semibold text-teal-700">
                <span className="hidden sm:inline">Get started</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CITIES
        ══════════════════════════════════════════════════════════════ */}
        <section id="cities" className="border-y border-slate-200 bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={MapPin}
              label="Service areas"
              title="We are available in"
              subtitle="Verified home-visit physiotherapists across Lower Assam. Pick your town to see local coverage."
              center
            />

            <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 md:grid-cols-4">
              {SERVICE_CITIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/physio-in/${c.slug}`}
                    className="interactive-lift flex h-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
                  >
                    <span>Physio in {c.name}</span>
                    <ChevronRight size={15} className="text-teal-500" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Popular local searches</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                People often search for{' '}
                <Link to="/physio-in/bongaigaon" className="font-semibold text-teal-700 hover:text-teal-800">
                  physio in Bongaigaon
                </Link>{' '}
                and{' '}
                <Link to="/physio-in/kokrajhar" className="font-semibold text-teal-700 hover:text-teal-800">
                  physiotherapist in Kokrajhar
                </Link>
                . Open city pages to view local coverage.
              </p>
              <Link to="/near-me-physio" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800">
                Explore near-me hub
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════════════ */}
        <section id="faq" className="bg-slate-50 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={HelpCircle}
              label="FAQ"
              title="Common questions"
              subtitle="Quick answers about booking home physiotherapy with PhysioKhom."
              center
            />

            <div className="mt-12 rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
              {HOME_FAQ.map((item, i) => (
                <FaqItem
                  key={item.q}
                  q={item.q}
                  a={item.a}
                  open={openFaq === i}
                  onToggle={() => toggleFaq(i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-teal-600 py-20 lg:py-24">
          <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/6" aria-hidden />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-white/5" aria-hidden />

          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white">
              <MapPin size={11} />
              Available in your locality
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to book?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-white/80">
              Sign in with your phone, pick a slot, pay to confirm — we'll handle the rest.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/book"
                className="interactive-press inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-[15px] font-semibold text-teal-700 shadow-lg transition hover:bg-teal-50"
              >
                Find physios near me
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/register"
                className="inline-flex h-12 items-center rounded-xl border border-white/30 px-7 text-[15px] font-semibold text-white transition hover:bg-white/10"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 shadow-md shadow-teal-600/25">
                  <Activity size={16} className="text-white" />
                </span>
                <span className="text-[15px] font-semibold tracking-tight">PhysioKhom</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Home visit physiotherapy across Assam. Verified clinicians, simple booking, transparent pricing.
              </p>
              <p className="mt-5 text-sm text-white/40">
                &copy; {new Date().getFullYear()} PhysioKhom
              </p>
            </div>

            {/* For patients */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">For Patients</p>
              <nav className="flex flex-col gap-2.5 text-sm text-white/70">
                <Link to="/book" className="transition-colors hover:text-white">Book a physio</Link>
                <Link to="/register" className="transition-colors hover:text-white">Create account</Link>
                <Link to="/login" className="transition-colors hover:text-white">Sign in</Link>
                <a href="#services" className="transition-colors hover:text-white">Conditions we treat</a>
                <Link to="/near-me-physio" className="transition-colors hover:text-white">Find physio near me</Link>
              </nav>
            </div>

            {/* For physios */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">For Physios</p>
              <nav className="flex flex-col gap-2.5 text-sm text-white/70">
                <Link to="/register-physio" className="transition-colors hover:text-white">Join as physiotherapist</Link>
                <Link to="/login" className="transition-colors hover:text-white">Physio sign in</Link>
              </nav>
            </div>

            {/* Cities */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/40">Service Cities</p>
              <nav className="flex flex-col gap-2.5 text-sm text-white/70">
                {SERVICE_CITIES.slice(0, 5).map((c) => (
                  <Link key={c.slug} to={`/physio-in/${c.slug}`} className="transition-colors hover:text-white">
                    Physio in {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
