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
  XCircle,
  Calendar,
  Clock,
  Shield,
  ChevronLeft,
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

const HOME_TITLE = 'Physio Near Me in Assam | Home Visit Physiotherapy — PhysiOkhom'
const HOME_DESCRIPTION =
  'Looking for a physio near you in Assam? PhysiOkhom connects patients with verified home visit physiotherapists in Guwahati, Barpeta, Bongaigaon, Bijni, and Kokrajhar for back pain, knee pain, post-surgery rehab, and stroke recovery.'

const HOME_FAQ = [
  {
    q: 'How do I find a physiotherapist near me?',
    a: 'PhysiOkhom lists verified physiotherapists you can book for home visits. Create an account, share your location when you book, and we match you with an available clinician for your time slot.',
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
      name: 'PhysiOkhom',
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
      name: 'PhysiOkhom',
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
  'Other condition':    { Illustration: OtherConditionIllustration },
}

const CONDITIONS_WITH_OTHER = [
  ...ISSUE_OPTIONS,
  'Other condition',
]

/* ─── Small components ──────────────────────────────────────────────────── */

function SectionLabel({ Icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-100 shadow-sm">
        <Icon size={13} className="text-teal-600 animate-pulse" />
      </div>
      <span className="text-xs font-bold tracking-wider uppercase text-teal-800">{children}</span>
    </div>
  )
}

function SectionHeading({ label, labelIcon, title, subtitle, center = false }) {
  return (
    <div className={center ? 'text-center flex flex-col items-center' : ''}>
      {label && (
        <div className="mb-4">
          <SectionLabel Icon={labelIcon}>{label}</SectionLabel>
        </div>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed text-slate-500 ${center ? 'mx-auto max-w-2xl' : 'max-w-xl'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function FaqItem({ q, a, open, onToggle }) {
  const bodyRef = useRef(null)
  return (
    <div className={`mb-3 rounded-2xl border transition-all duration-300 ${open ? 'border-teal-500/30 bg-teal-50/20 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:text-teal-700"
        aria-expanded={open}
      >
        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all ${open ? 'bg-teal-600 text-white shadow-sm' : 'bg-teal-50 text-teal-600'}`}>
          <ChevronDown
            size={13}
            className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </span>
        <span className="flex-1 text-[15px] font-semibold text-slate-900">{q}</span>
      </button>
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 500) + 'px' : '0px' }}
      >
        <p className="pb-5 pl-15 pr-5 text-[15px] leading-relaxed text-slate-600">{a}</p>
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
  const [activeCondition, setActiveCondition] = useState(null)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [mockDateIndex, setMockDateIndex] = useState(0)

  function toggleFaq(i) {
    setOpenFaq((prev) => (prev === i ? null : i))
  }

  const testimonials = [
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
      text: 'My father had a stroke and needed daily physiotherapy. PhysiOkhom made it possible for him to recover at home, which made a huge difference in his morale.',
      initials: 'AK',
      rating: 5,
    },
  ]

  const mockDates = [
    { day: 'Mon', num: 25 },
    { day: 'Tue', num: 26 },
    { day: 'Wed', num: 27 },
    { day: 'Thu', num: 28 },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Helmet>
        <title>{HOME_TITLE}</title>
        <meta name="description" content={HOME_DESCRIPTION} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PhysiOkhom" />
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
        <section className="relative overflow-hidden bg-slate-900 py-16 text-white sm:py-24 lg:py-28">
          {/* Layered glowing orbs */}
          <div className="glow-orb absolute -top-1/4 -left-1/6 h-[70%] w-[50%] bg-teal-500 rounded-full" aria-hidden />
          <div className="glow-orb absolute -bottom-1/4 -right-1/6 h-[70%] w-[50%] bg-emerald-500 rounded-full" aria-hidden />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.1),rgba(15,23,42,0.9))]" aria-hidden />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              
              {/* Left: Text content */}
              <div className="space-y-6 lg:col-span-7">
                {/* Trust badge */}
                <div className="motion-safe:animate-enter inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300 shadow-sm shadow-teal-500/5">
                  <ShieldCheck size={12} className="animate-pulse" />
                  Verified home care · Assam
                </div>

                {/* Main Heading */}
                <h1 className="motion-safe:animate-enter-up animate-delay-1 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl sm:leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-teal-100">
                  Expert home physio, <br />
                  right at your door
                </h1>

                {/* Subtitle */}
                <p className="motion-safe:animate-enter-up animate-delay-2 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  PhysiOkhom connects patients with verified home-visit physiotherapists for back pain, knee pain,
                  post-surgery rehab, stroke recovery, and more. 
                  {areaLine ? (
                    <>
                      {' '}Currently serving <span className="font-semibold text-teal-300 underline decoration-teal-500/30 decoration-2 underline-offset-4">{areaLine}</span>.
                    </>
                  ) : null}
                </p>

                {/* CTA buttons */}
                <div className="motion-safe:animate-enter-up animate-delay-3 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                  <Link
                    to="/book"
                    className="interactive-press inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 text-base font-semibold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-700"
                  >
                    Book a session
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex h-13 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-7 text-base font-semibold text-slate-100 backdrop-blur-sm transition-all hover:bg-slate-800 hover:border-slate-600"
                  >
                    Sign in
                  </Link>
                </div>

                {/* Register link */}
                <p className="motion-safe:animate-enter-up animate-delay-3 text-sm text-slate-400">
                  New here?{' '}
                  <Link to="/register" className="font-semibold text-teal-400 hover:text-teal-300 hover:underline">
                    Create a free account →
                  </Link>
                </p>

                {/* Stats pills */}
                <div className="motion-safe:animate-enter-up animate-delay-4 pt-6 flex flex-wrap items-center gap-3 border-t border-slate-800/80">
                  {STAT_PILLS.map(({ Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-sm shadow-sm"
                    >
                      <Icon size={12} className="text-teal-400" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Interactive Schedule Mockup */}
              <div className="lg:col-span-5 relative">
                {/* Glowing backdrop shadow */}
                <div className="absolute inset-0 bg-teal-500/10 blur-[80px] rounded-full" />
                
                {/* Dashboard Mockup Card */}
                <div className="relative glass-card mx-auto max-w-sm rounded-3xl p-6 border border-white/20 shadow-2xl text-slate-900 overflow-hidden">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live booking engine</span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full">Interactive preview</span>
                  </div>
                  
                  {/* Step 1 Date selector */}
                  <p className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-extrabold text-slate-700">1</span>
                    Select Date
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {mockDates.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setMockDateIndex(idx)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          mockDateIndex === idx
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20 scale-[1.03]'
                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <span className="text-[9px] uppercase font-bold tracking-wide">{item.day}</span>
                        <span className="text-sm font-extrabold mt-0.5">{item.num}</span>
                      </button>
                    ))}
                  </div>

                  {/* Step 2 Match Clinician */}
                  <p className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-extrabold text-slate-700">2</span>
                    Clinician Matched
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-100 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        AD
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">Dr. Abhijit Das, MPT</p>
                          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-teal-500 text-white text-[8px] font-bold">✓</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium truncate">Ortho Specialist · 8+ yrs exp</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                          <span className="text-[9px] font-bold text-slate-600">4.9</span>
                          <span className="text-[9px] text-slate-400 font-medium">(42 reviews)</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Assigned
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-dashed border-teal-500/30 bg-teal-50/20 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-teal-600 animate-pulse" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-800">GPS Session Enabled</p>
                          <p className="text-[8px] text-slate-500 font-semibold">Live tracking on appointment arrival</p>
                        </div>
                      </div>
                      <span className="flex h-1.5 w-1.5 rounded-full bg-teal-600 animate-ping" />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="border-b border-slate-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={Sparkles}
              label="Simple process"
              title="How it works"
              subtitle="Three simple steps from booking to clinical treatment at your doorstep."
              center
            />

            <div className="mt-16 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
              {HOW_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className={
                    'glass-card group relative rounded-2xl p-8 transition-all hover:shadow-lg ' +
                    ['animate-delay-1', 'animate-delay-2', 'animate-delay-3'][i]
                  }
                >
                  {/* connector line on desktop */}
                  {i < HOW_STEPS.length - 1 && (
                    <div
                      className="absolute top-[2.8rem] -right-4 hidden h-0.5 w-8 bg-teal-100 md:block"
                      aria-hidden
                    />
                  )}
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow-md shadow-teal-600/20">
                      {i + 1}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-100/50">
                      <step.Icon size={18} className="text-teal-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CONDITIONS WE TREAT (INTERACTIVE symptom grid)
        ══════════════════════════════════════════════════════════════ */}
        <section id="services" className="border-b border-slate-200 bg-slate-50 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={Stethoscope}
              label="Interactive Diagnosis"
              title="Where does it hurt?"
              subtitle="Select your pain area or condition below to learn more and book targeted treatments."
              center
            />

            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {CONDITIONS_WITH_OTHER.map((title) => {
                const { Illustration } = CONDITION_CONFIG[title] || { Illustration: OtherConditionIllustration }
                const isSelected = activeCondition === title
                return (
                  <button
                    key={title}
                    onClick={() => setActiveCondition(isSelected ? null : title)}
                    className={`group text-left rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                      isSelected
                        ? 'border-teal-500 bg-white ring-2 ring-teal-500/20 shadow-md scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-4/3 w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                      <Illustration className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-105" />
                    </div>
                    
                    <div className="px-5 py-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">{title}</span>
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-teal-600 border-teal-600 text-white' 
                          : 'border-slate-300 group-hover:border-teal-400'
                      }`}>
                        {isSelected ? <CheckCircle2 size={10} className="stroke-[3]" /> : null}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Dynamic CTA box based on selected symptom */}
            <div className="mt-10 max-w-xl mx-auto">
              <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 text-center shadow-sm">
                {activeCondition ? (
                  <div>
                    <p className="text-sm text-teal-900 mb-4 font-medium">
                      You've selected <span className="font-bold">{activeCondition}</span>. We assign specialized BPT/MPT physiotherapists.
                    </p>
                    <Link
                      to="/book"
                      state={{ selectedIssue: activeCondition }}
                      className="interactive-press inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white shadow-md hover:bg-teal-700"
                    >
                      Book for {activeCondition}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500 mb-4">
                      Select any condition above to auto-fill the booking request, or proceed to the list.
                    </p>
                    <Link
                      to="/book"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
                    >
                      Search all physiotherapists
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            WHY PHYSIOKHOM (COMPARISON GRID)
        ══════════════════════════════════════════════════════════════ */}
        <section id="why" className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={Star}
              label="Care Comparison"
              title="Commute vs. Comfort"
              subtitle="See how PhysiOkhom transforms your rehabilitation experience compared to traditional clinic commuting."
              center
            />

            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              {/* Clinic Commute */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
                    <XCircle className="text-rose-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Traditional Clinic Visits</h3>
                    <p className="text-xs text-slate-500 font-medium">Standard outpatient commutes</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {[
                    'Painful traveling when injured or in recovery',
                    'Wasted time sitting in waiting rooms',
                    'Commute delays & transport costs',
                    'Shared clinical environment (less privacy)',
                    'Rigid timing slots with little flexibility'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="h-5 w-5 shrink-0 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold mt-0.5">✕</span>
                      <span className="text-sm font-medium text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PhysiOkhom At-Home Care */}
              <div className="rounded-3xl border border-teal-500/30 bg-teal-50/20 p-8 shadow-md relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 border border-teal-200 shadow-sm">
                    <CheckCircle2 className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">PhysiOkhom Home Visits</h3>
                    <p className="text-xs text-teal-700 font-bold uppercase tracking-wider">Premium standard</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {[
                    '0 Commute: Therapy in the comfort of your room',
                    '1-on-1 focus: Full attention of your physician',
                    'Flexible schedule times fitted to your daily routine',
                    'Pre-screened & highly vetted professional practitioners',
                    'GPS-tracked secure bookings with real-time arrival logs'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="h-5 w-5 shrink-0 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold mt-0.5">✓</span>
                      <span className="text-sm font-semibold text-slate-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FEATURED PHYSIOS
        ══════════════════════════════════════════════════════════════ */}
        <FeaturedPhysiosSection />

        {/* ══════════════════════════════════════════════════════════════
            SAFETY PROMISE & SHIELD
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-slate-900 py-20 text-white relative overflow-hidden border-y border-slate-800">
          <div className="glow-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-[60%] bg-teal-500/10 rounded-full blur-[100px]" aria-hidden />

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative text-center flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-6 shadow-lg shadow-teal-500/5">
              <Shield size={24} className="animate-pulse" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              Our Safety Promise
            </h2>
            <p className="mt-4 max-w-2xl text-slate-400 text-base leading-relaxed">
              We understand welcoming a professional into your home requires absolute trust. We maintain rigorous standards to guarantee safety and compliance.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-4 text-left w-full">
              {[
                { title: 'Credential Checked', desc: 'Verified MPT/BPT medical graduates with clinical backgrounds.' },
                { title: 'Background Verified', desc: 'Clean background check verification checks prior to platform approval.' },
                { title: 'GPS Logged Sessions', desc: 'Secure appointments are fully monitored with location status logs.' },
                { title: 'Sanitized Equipment', desc: 'Portable gear and elements sanitized before entering your home.' }
              ].map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-md">
                  <h3 className="text-sm font-bold text-teal-400">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            TESTIMONIALS (Interactive slider)
        ══════════════════════════════════════════════════════════════ */}
        <section className="border-b border-slate-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={MessageSquare}
              label="Patient Reviews"
              title="Stories of Recovery"
              center
            />

            {/* Testimonial slider wrap */}
            <div className="mt-14 relative">
              <div className="glass-card rounded-3xl p-8 md:p-10 shadow-lg relative border border-slate-100 overflow-hidden">
                <span className="absolute top-2 right-6 text-9xl text-teal-600/5 font-serif select-none pointer-events-none">“</span>
                
                {/* Active review content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-base font-extrabold text-white shadow-md shadow-teal-500/10">
                      {testimonials[testimonialIndex].initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-900">{testimonials[testimonialIndex].name}</p>
                      <p className="text-xs text-slate-500 font-semibold">{testimonials[testimonialIndex].location}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: testimonials[testimonialIndex].rating }).map((_, idx) => (
                        <Star key={idx} size={14} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-base md:text-lg leading-relaxed text-slate-600 italic font-medium">
                    "{testimonials[testimonialIndex].text}"
                  </p>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <CheckCircle2 size={14} className="text-teal-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Verified recovery patient</span>
                  </div>
                </div>
              </div>

              {/* Slider Controls */}
              <div className="mt-6 flex items-center justify-between">
                {/* Dot Indicators */}
                <div className="flex gap-1.5">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestimonialIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        testimonialIndex === idx ? 'w-6 bg-teal-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Arrow buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                    aria-label="Previous review"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                    aria-label="Next review"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            JOIN AS PHYSIO BANNER
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-slate-50 py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Link
              to="/register-physio"
              className="interactive-lift flex items-center gap-5 rounded-3xl border border-teal-100 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md md:p-8"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
                <HeartPulse size={22} className="text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-slate-900">
                  Are you a professional physiotherapist?
                </p>
                <p className="mt-1 text-sm text-slate-500 font-medium">
                  Join PhysiOkhom — list your practice, configure available slots, and take flexible home-visit appointments.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-teal-700">
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
              title="Available Locations"
              subtitle="Home-visit physiotherapy services available across Lower Assam. Pick your town to explore."
              center
            />

            <ul className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 md:grid-cols-4">
              {SERVICE_CITIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/physio-in/${c.slug}`}
                    className="interactive-lift flex h-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
                  >
                    <span>Physio in {c.name}</span>
                    <ChevronRight size={15} className="text-teal-500" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Popular local searches</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
                People often search for{' '}
                <Link to="/physio-in/bongaigaon" className="font-semibold text-teal-700 hover:underline">
                  physio in Bongaigaon
                </Link>{' '}
                and{' '}
                <Link to="/physio-in/kokrajhar" className="font-semibold text-teal-700 hover:underline">
                  physiotherapist in Kokrajhar
                </Link>
                . Pick your city to see practitioner details.
              </p>
              <Link to="/near-me-physio" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-800">
                Explore near-me hub
                <ArrowRight size={14} />
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
              subtitle="Quick details about booking home visit physiotherapy sessions with PhysiOkhom."
              center
            />

            <div className="mt-12">
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
        <section className="relative overflow-hidden bg-slate-900 py-20 text-white lg:py-24">
          <div className="glow-orb absolute -top-1/4 -right-1/4 h-[70%] w-[50%] bg-teal-500 rounded-full" />
          <div className="glow-orb absolute -bottom-1/4 -left-1/4 h-[70%] w-[50%] bg-emerald-500 rounded-full" />

          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300">
              <MapPin size={12} className="animate-pulse" />
              Available in your region
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              Ready to recover?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-300 text-base leading-relaxed">
              Register with your phone, pick an available slot, confirm your appointment — we handle the rest.
            </p>
            
            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center max-w-sm mx-auto sm:max-w-none">
              <Link
                to="/book"
                className="interactive-press inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 text-base font-semibold text-white shadow-lg hover:bg-teal-700"
              >
                Find clinicians near me
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex h-13 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-7 text-base font-semibold text-slate-100 backdrop-blur-sm hover:bg-slate-800 hover:border-slate-600"
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
      <footer className="border-t border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 shadow-md shadow-teal-600/25">
                  <Activity size={16} className="text-white" />
                </span>
                <span className="text-[15px] font-bold tracking-tight">PhysiOkhom</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Home visit physiotherapy services across Lower Assam. Vetted doctors, simple scheduling, transparent packages.
              </p>
              <p className="mt-5 text-xs text-slate-500">
                &copy; {new Date().getFullYear()} PhysiOkhom. All rights reserved.
              </p>
            </div>

            {/* For patients */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">For Patients</p>
              <nav className="flex flex-col gap-2.5 text-sm text-slate-400">
                <Link to="/book" className="transition-colors hover:text-white">Book a physio</Link>
                <Link to="/register" className="transition-colors hover:text-white">Create account</Link>
                <Link to="/login" className="transition-colors hover:text-white">Sign in</Link>
                <a href="#services" className="transition-colors hover:text-white">Conditions we treat</a>
                <Link to="/near-me-physio" className="transition-colors hover:text-white">Find physio near me</Link>
              </nav>
            </div>

            {/* For physios */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">For Clinicians</p>
              <nav className="flex flex-col gap-2.5 text-sm text-slate-400">
                <Link to="/register-physio" className="transition-colors hover:text-white">Join as physiotherapist</Link>
                <Link to="/login" className="transition-colors hover:text-white">Physio sign in</Link>
              </nav>
            </div>

            {/* Cities */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Service Regions</p>
              <nav className="flex flex-col gap-2.5 text-sm text-slate-400">
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
