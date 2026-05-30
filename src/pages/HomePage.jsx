import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  ShieldCheck,
  Home,
  CreditCard,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  ChevronRight,
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
  Bell,
  PhoneCall,
  Check,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { ISSUE_OPTIONS } from '../constants/issues'
import { SERVICE_CITIES } from '../constants/serviceCities'
import SiteHeader from '../components/layout/SiteHeader'
import FeaturedPhysiosSection from '../components/home/FeaturedPhysiosSection'
import { absoluteUrl, primaryServiceAreas, primaryServiceAreasSentence, siteOrigin } from '../utils/siteMeta'
import { getToken } from '../auth/session'
import { api } from '../config/api'

// Import newly copied assets
import specialtyOrthopedic from '../assets/specialty_orthopedic.png'
import specialtyNeuro from '../assets/specialty_neuro.png'
import specialtyKnee from '../assets/specialty_knee.png'
import specialtyPostOp from '../assets/specialty_post_op.png'
import specialtyNeck from '../assets/specialty_neck.png'
import specialtyOther from '../assets/specialty_other.png'

import techniqueCupping   from '../assets/technique_cupping.png'
import techniqueNeedling  from '../assets/technique_needling.png'
import techniquePediatric from '../assets/technique_pediatric.png'
import techniqueElderly   from '../assets/technique_elderly.png'
import techniqueKinesio   from '../assets/technique_kinesio.png'

import illustrationOther  from '../assets/illustration_other.png'

import illustrationBackPain from '../assets/illustration_back_pain.png'
import illustrationKneePain from '../assets/illustration_knee_pain.png'
import illustrationNeckPain from '../assets/illustration_neck_pain.png'
import illustrationNeuroRehab from '../assets/illustration_neuro_rehab.png'

/* ─── SEO ──────────────────────────────────────────────────────────────── */

const HOME_TITLE = 'Physio Near Me in Assam | Home Visit Physiotherapy — PhysiOkhom'
const HOME_DESCRIPTION =
  'Looking for a physio near you in Assam? PhysiOkhom connects patients with verified home visit physiotherapists in Guwahati, Barpeta, Bongaigaon, Bijni, and Kokrajhar for back pain, knee pain, post-surgery rehab, and stroke recovery.'

const HOME_FAQ = [
  {
    q: 'How do I find a physiotherapist near me?',
    a: 'PhysiOkhom lists verified physiotherapists you can book for home visits. Create an account, share your location when you book, and we match you with an available clinician for your time slot.',
    cat: 'Booking',
  },
  {
    q: 'Is this physio at home or in a clinic?',
    a: 'Our focus is home visit physiotherapy so you can recover where you are comfortable, without the clinic commute.',
    cat: 'Booking',
  },
  {
    q: 'Are therapists verified?',
    a: 'Profiles marked as verified have completed our platform checks. You can read reviews on individual physiotherapist pages before you book.',
    cat: 'Therapists',
  },
  {
    q: 'How does booking work?',
    a: 'You choose a date and time slot, pay online to confirm, and our team assigns a qualified physiotherapist. You can track your booking in your dashboard.',
    cat: 'Booking',
  },
  {
    q: 'What conditions do you help with?',
    a: 'Common examples include back pain, neck pain, knee pain, post-surgery rehabilitation, and stroke or paralysis support — plus other issues you can describe when booking.',
    cat: 'Therapists',
  },
  {
    q: 'How do payments work?',
    a: 'We accept credit/debit cards, UPI, and Netbanking through Razorpay. You can pay per session or buy a package.',
    cat: 'Payments',
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

const SPECIALTIES = [
  { id: 'Back Pain', title: 'Orthopedic', image: specialtyOrthopedic, bg: 'bg-[#e6f4f3]', color: 'text-[#0d6b6b]' },
  { id: 'Neuro Rehab', title: 'Neuro Rehab', image: specialtyNeuro, bg: 'bg-[#eff6ff]', color: 'text-[#2563eb]' },
  { id: 'Pediatric Rehab', title: 'Pediatric Rehab', image: techniquePediatric, bg: 'bg-[#eff6ff]', color: 'text-[#1d4ed8]' },
  { id: 'Post Surgery Rehab', title: 'Post-Op', image: specialtyPostOp, bg: 'bg-[#ecfdf5]', color: 'text-[#047857]' },
  { id: 'Elderly Care', title: 'Elderly Care', image: techniqueElderly, bg: 'bg-[#f0fdf4]', color: 'text-[#15803d]' },
  { id: 'Many More', title: 'Other Care', image: specialtyOther, bg: 'bg-[#fff1f2]', color: 'text-[#dc2626]' },
]

const TECHNIQUES = [
  { title: 'Cupping Therapy', image: techniqueCupping,   bg: 'bg-[#fff7ed]', color: 'text-[#c2410c]' },
  { title: 'Dry Needling',   image: techniqueNeedling,  bg: 'bg-[#f5f3ff]', color: 'text-[#6d28d9]' },
  { title: 'Kinesio Taping', image: techniqueKinesio,   bg: 'bg-[#e6f4f3]', color: 'text-[#0d6b6b]' },
]

const PLAN_TIER_CARDS = [
  {
    label: '7-Day Plan',
    sessions: 7,
    discountPercent: 0,
    badge: 'STARTER',
    saveCallout: null,
    desc: '7 daily home sessions. Pay 1 session upfront, 100% by session 5.',
    icon: Calendar,
    bg: 'bg-white',
    border: 'border-slate-200',
    color: 'text-teal-700',
    titleColor: 'text-slate-900',
  },
  {
    label: '15-Day Plan',
    sessions: 15,
    discountPercent: 3.33,
    badge: 'MOST POPULAR',
    saveCallout: 'SAVE 3.33%',
    desc: '15 sessions. Pay 50% by session 5, 100% by session 12.',
    icon: Activity,
    bg: 'bg-[#f4fbf7]',
    border: 'border-emerald-200',
    color: 'text-emerald-700',
    titleColor: 'text-emerald-950',
  },
  {
    label: '30-Day Plan',
    sessions: 30,
    discountPercent: 4.67,
    badge: 'BEST VALUE',
    saveCallout: 'SAVE 4.67%',
    desc: '30 sessions. Pay 50% by session 10, 75% by session 20, 100% by session 25.',
    icon: ShieldCheck,
    bg: 'bg-[#f0f9ff]',
    border: 'border-sky-200',
    color: 'text-sky-700',
    titleColor: 'text-sky-950',
  },
]

const FRONT_SPOTS = [
  { id: 'neck', name: 'Neck & Cervical Care', issue: 'Neck Pain', top: '25px', left: '60px', icon: Sparkles, desc: 'Stiffness, cervical spondylosis, nerve strain' },
  { id: 'shoulder_l', name: 'Left Shoulder Care', issue: 'Neck Pain', top: '40px', left: '28px', icon: Sparkles, desc: 'Frozen shoulder, rotatory stiffness, impingement' },
  { id: 'shoulder_r', name: 'Right Shoulder Care', issue: 'Neck Pain', top: '40px', left: '92px', icon: Sparkles, desc: 'Frozen shoulder, rotatory stiffness, impingement' },
  { id: 'knee_l', name: 'Left Knee Joint', issue: 'Knee Pain', top: '162px', left: '41px', icon: Activity, desc: 'Arthritis, ligament tear, meniscus injury' },
  { id: 'knee_r', name: 'Right Knee Joint', issue: 'Knee Pain', top: '162px', left: '79px', icon: Activity, desc: 'Arthritis, ligament tear, meniscus injury' },
]

const BACK_SPOTS = [
  { id: 'upper_back', name: 'Upper Spine & Posture', issue: 'Neck Pain', top: '45px', left: '60px', icon: Sparkles, desc: 'Upper back postural strain, thoracic stiffness' },
  { id: 'lower_back', name: 'Lower Back Care', issue: 'Back Pain', top: '85px', left: '60px', icon: Home, desc: 'Sciatica, slip disc, lumbar muscle spasms' },
  { id: 'neuro_rehab', name: 'Stroke Rehabilitation', issue: 'Neuro Rehab', top: '15px', left: '78px', icon: HeartPulse, desc: 'Hemiplegia, neural weakness, balance issues' },
]

const FAQ_CATEGORIES = ['All', 'Booking', 'Therapists', 'Payments']

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
  const navigate = useNavigate()
  const siteBase = (siteOrigin() || 'http://localhost:5173').replace(/\/$/, '')
  const canonical = absoluteUrl('/')
  const ogImage = absoluteUrl('/og-default.png')
  const areaLine = primaryServiceAreasSentence()
  const ldJson = JSON.stringify(homeStructuredData({ siteBase, ogImage, areas: primaryServiceAreas() }))

  // Auth & Session state
  const [token, setToken] = useState(getToken())
  const [userName, setUserName] = useState('')
  const [userLocation, setUserLocation] = useState('')
  const [searchCoords, setSearchCoords] = useState({ lat: 26.1445, lng: 91.7362 }) // Guwahati default
  const [activeBooking, setActiveBooking] = useState(null)
  const [consultationClaimed, setConsultationClaimed] = useState(false)

  // Live Stats
  const [homeStats, setHomeStats] = useState({
    activeSpecialists: null,
    bookingRateToday: null,
    loading: true,
  })

  // Body Map & Interactive state
  const [painViewMode, setPainViewMode] = useState('grid') // 'grid' | 'map'
  const [bodyViewSide, setBodyViewSide] = useState('front') // 'front' | 'back'
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [selectedPainScale, setSelectedPainScale] = useState(5)

  // FAQs
  const [activeFaqCat, setActiveFaqCat] = useState('All')
  const [openFaq, setOpenFaq] = useState(null)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [mockDateIndex, setMockDateIndex] = useState(0)

  // Listen to local session changes
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(getToken())
    }
    window.addEventListener('auth-session-changed', handleAuthChange)
    return () => window.removeEventListener('auth-session-changed', handleAuthChange)
  }, [])

  // Fetch Profile and active booking
  useEffect(() => {
    if (!token) {
      setUserName('')
      setUserLocation('')
      setActiveBooking(null)
      return
    }
    let active = true
    async function fetchProfileAndBookings() {
      try {
        const res = await api.get('/profile')
        if (!active) return
        if (res.data?.name) {
          setUserName(res.data.name.split(' ')[0])
        }
        if (res.data?.address?.text) {
          const parts = res.data.address.text.split(',')
          const label = parts[0]?.trim() || ''
          setUserLocation(label)
        }
        if (res.data?.address?.lat && res.data?.address?.lng) {
          setSearchCoords({
            lat: Number(res.data.address.lat),
            lng: Number(res.data.address.lng),
          })
        }
      } catch (err) {
        // Silent catch
      }

      try {
        const res = await api.get('/bookings/mine', { params: { limit: 20 } })
        if (!active) return
        const bookings = res.data?.data || []
        const found = bookings.find((b) => b.sessionStatus !== 'completed') || null
        setActiveBooking(found)
      } catch (err) {
        // Silent catch
      }
    }
    fetchProfileAndBookings()
    return () => {
      active = false
    }
  }, [token])

  // Fetch Live platform statistics
  const serviceAreaLabel = userLocation || 'Guwahati'
  useEffect(() => {
    let active = true
    async function fetchHomeStats() {
      try {
        setHomeStats((prev) => ({ ...prev, loading: true }))
        const response = await api.get('/platform/home-stats', {
          params: {
            lat: searchCoords.lat,
            lng: searchCoords.lng,
            city: serviceAreaLabel,
          },
        })
        if (!active) return
        setHomeStats({
          activeSpecialists: Number(response.data?.activeSpecialists ?? 0),
          bookingRateToday:
            response.data?.bookingRateToday == null
              ? null
              : Number(response.data.bookingRateToday),
          loading: false,
        })
      } catch (err) {
        if (active) {
          setHomeStats({ activeSpecialists: 0, bookingRateToday: null, loading: false })
        }
      }
    }
    fetchHomeStats()
    return () => {
      active = false
    }
  }, [searchCoords, serviceAreaLabel])

  // Helpers
  const demandInsightText = useMemo(() => {
    if (homeStats.loading) return 'Checking live availability in your area…'
    const count = homeStats.activeSpecialists || 3
    const ratePart =
      homeStats.bookingRateToday == null
        ? ''
        : ` · ${homeStats.bookingRateToday}% slots filled today`
    return `⚡ ${count} active specialist${count === 1 ? '' : 's'} in ${serviceAreaLabel}${ratePart}`
  }, [homeStats.loading, homeStats.activeSpecialists, homeStats.bookingRateToday, serviceAreaLabel])

  const getPainColor = (val) => {
    if (val <= 3) return '#10b981'
    if (val <= 6) return '#f59e0b'
    if (val <= 8) return '#f97316'
    return '#ef4444'
  }

  const getPainBgColor = (val) => {
    if (val <= 3) return 'rgba(16, 185, 129, 0.15)'
    if (val <= 6) return 'rgba(245, 158, 11, 0.15)'
    if (val <= 8) return 'rgba(249, 115, 22, 0.15)'
    return 'rgba(239, 68, 68, 0.15)'
  }

  const getPainLabel = (val) => {
    if (val <= 3) return 'Mild'
    if (val <= 6) return 'Moderate'
    if (val <= 8) return 'Severe'
    return 'Extreme'
  }

  const getPainEmoji = (val) => {
    if (val <= 3) return '😊'
    if (val <= 6) return '😐'
    if (val <= 8) return '😟'
    return '😫'
  }

  const getClinicalGuideTitle = (val) => {
    if (val <= 3) return 'Mild Discomfort'
    if (val <= 6) return 'Moderate Pain'
    if (val <= 8) return 'Severe Pain'
    return 'Extreme Pain'
  }

  const getClinicalGuideDesc = (val) => {
    if (val <= 3) return 'Rehab focus: gentle mobility exercises and light active stretching to recover joint range of motion. Safe for home routines.'
    if (val <= 6) return 'Rehab focus: progressive load management, active stabilization, and customized strength routines.'
    if (val <= 8) return 'Rehab focus: passive pain-relief modalities, gentle manual therapy, and joint mobilization. Avoid loading.'
    return 'Rehab focus: strict pain control, postural unloading, and emergency-safe gentle manual care under direct senior oversight.'
  }

  const handleSpotSelect = (spot) => {
    setSelectedSpot(spot)
    setSelectedPainScale(5)
  }

  const handlePainScaleChange = (num) => {
    setSelectedPainScale(num)
  }

  const handleClaimConsultation = () => {
    setConsultationClaimed(true)
    alert(
      'Consultation Claimed!\n\nOur Care Coordinator will call you in the next 15 minutes to understand your symptoms and match you with the right specialist.'
    )
  }

  const toggleFaq = (i) => {
    setOpenFaq((prev) => (prev === i ? null : i))
  }

  // Filter FAQs based on tab
  const filteredFaqs = HOME_FAQ.filter((item) => {
    if (activeFaqCat === 'All') return true
    return item.cat === activeFaqCat
  })

  // Mock schedule dates
  const mockDates = [
    { day: 'Mon', num: 25 },
    { day: 'Tue', num: 26 },
    { day: 'Wed', num: 27 },
    { day: 'Thu', num: 28 },
  ]

  // Testimonials
  const testimonials = [
    {
      name: 'Priya Bora',
      location: 'Beltola, Kokrajhar',
      text: 'My recovery after knee surgery was much faster thanks to regular home physio sessions. The physiotherapist was professional, punctual, and very caring. Highly recommended!',
      initials: 'PB',
      rating: 5,
      sessions: '12 sessions completed',
    },
    {
      name: 'Rajesh Kalita',
      location: 'Kahilipara, Kokrajhar',
      text: 'Due to stroke, my father had severe mobility issues. The neuro rehabilitation specialist worked wonders. His posture and movement have improved by 70%.',
      initials: 'RK',
      rating: 5,
      sessions: '20 sessions completed',
    },
    {
      name: 'Nayan Das',
      location: 'Zoo Road, Kokrajhar',
      text: 'Extremely convenient! No need to travel through heavy traffic with lower back pain. Dr. Sharma brought all bands and clinical gear. Excellent home treatment.',
      initials: 'ND',
      rating: 5,
      sessions: '8 sessions completed',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans">
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

      {/* Sweeping scan vertical animation definition */}
      <style>{`
        @keyframes scanSweep {
          0% { transform: translateY(-10px); }
          50% { transform: translateY(240px); }
          100% { transform: translateY(-10px); }
        }
        .scan-line-element {
          animation: scanSweep 6s infinite linear;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <SiteHeader />

      <main className="overflow-hidden">
        {/* ══════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-slate-900 py-16 text-white sm:py-24 lg:py-28">
          {/* Layered glowing orbs */}
          <div className="absolute -top-1/4 -left-[16%] h-[70%] w-[50%] bg-teal-500/10 rounded-full blur-[100px]" aria-hidden />
          <div className="absolute -bottom-1/4 -right-[16%] h-[70%] w-[50%] bg-emerald-500/10 rounded-full blur-[100px]" aria-hidden />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.1),rgba(15,23,42,0.9))]" aria-hidden />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center w-full">
              
              {/* Left: Text content */}
              <div className="space-y-6 lg:col-span-7">
                {/* Real-time Demand Activity Pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300 shadow-sm shadow-teal-500/5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{demandInsightText}</span>
                </div>

                <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl sm:leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-teal-100">
                  {userName ? (
                    <>
                      Hello, {userName} 👋 <br />
                      Connect with expert physiotherapists near you
                    </>
                  ) : (
                    <>
                      Connect with expert <br />
                      physiotherapists near you
                    </>
                  )}
                </h1>

                {/* Subtitle */}
                <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  PhysiOkhom connects patients with qualified, clinical physiotherapy specialists for post-surgery rehab, stroke recovery, and more. 
                  {areaLine ? (
                    <>
                      {' '}Currently serving <span className="font-semibold text-teal-300 underline decoration-teal-500/30 decoration-2 underline-offset-4">{areaLine}</span>.
                    </>
                  ) : null}
                </p>

                {/* Dual Search Bar */}
                <div className="bg-white text-slate-900 rounded-2xl p-2 shadow-lg max-w-xl flex flex-col sm:flex-row gap-2 border border-slate-200">
                  <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-100">
                    <MapPin className="text-teal-600 w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold truncate text-slate-700">{serviceAreaLabel}</span>
                  </div>
                  <div className="flex-[2] min-w-0 flex items-center gap-2 px-3 py-2">
                    <Search className="text-slate-400 w-4 h-4 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search symptoms or therapies..."
                      onClick={() => navigate('/book')}
                      readOnly
                      className="w-full text-sm outline-none bg-transparent cursor-pointer text-slate-700"
                    />
                  </div>
                  <button
                    onClick={() => navigate('/book')}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-1 shrink-0"
                  >
                    Search
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Register link */}
                {!token && (
                  <p className="text-sm text-slate-400">
                    New here?{' '}
                    <Link to="/register" className="font-semibold text-teal-400 hover:text-teal-300 hover:underline">
                      Create a free account →
                    </Link>
                  </p>
                )}

                {/* Stats pills */}
                <div className="pt-6 flex flex-wrap items-center gap-3 border-t border-slate-800/80">
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
                <div className="relative glass-card w-full max-w-sm mx-auto rounded-3xl p-6 border border-white/20 shadow-2xl text-slate-900 overflow-hidden bg-white">
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
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
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
                        <Clock size={14} className="text-teal-600" />
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
            DYNAMIC USER HEALTH HUB
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-12 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {!token ? (
              /* GUEST STATE CHECKLIST */
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 mb-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                      <Sparkles size={11} className="animate-pulse" />
                      Your Recovery Steps
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">Start your recovery path in 3 easy steps</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full mt-2 sm:mt-0">
                    {consultationClaimed ? '1 of 3 steps completed' : '0 of 3 steps completed'}
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Step 1 */}
                  <Link
                    to="/register"
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">Create Free Account</h4>
                      <p className="text-xs text-slate-500 mt-1">Sign up with your phone number to store reports and log slots.</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto shrink-0 self-center" />
                  </Link>

                  {/* Step 2 */}
                  <div
                    onClick={consultationClaimed ? undefined : handleClaimConsultation}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                      consultationClaimed
                        ? 'bg-emerald-50/20 border-emerald-100/50'
                        : 'border-transparent hover:border-slate-100 hover:bg-slate-50 cursor-pointer group'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      consultationClaimed
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-teal-50 border border-teal-100 text-teal-700'
                    }`}>
                      {consultationClaimed ? <Check size={14} /> : '2'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className={`font-bold text-sm ${consultationClaimed ? 'text-emerald-800 line-through' : 'text-slate-900 group-hover:text-teal-700 transition-colors'}`}>
                          Claim Phone Assessment
                        </h4>
                        {!consultationClaimed && (
                          <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase">Free</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Get a free 10-minute assessment call from senior clinical consultants.</p>
                    </div>
                    {!consultationClaimed && (
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto shrink-0 self-center" />
                    )}
                  </div>

                  {/* Step 3 */}
                  <Link
                    to="/book"
                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">Schedule At-Home Visit</h4>
                      <p className="text-xs text-slate-500 mt-1">Pick a date & match with a background-verified therapist near you.</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform ml-auto shrink-0 self-center" />
                  </Link>
                </div>
              </div>
            ) : activeBooking ? (
              /* LOGGED IN + ACTIVE BOOKING STATE */
              <div className="bg-white border border-teal-100/50 rounded-3xl p-6 md:p-8 shadow-sm">
                {(() => {
                  const schedule = Array.isArray(activeBooking.schedule) ? activeBooking.schedule : []
                  const totalSessions = Number(activeBooking.sessions) || Math.max(1, schedule.length)
                  const completedSessions = schedule.filter((s) => s.status === 'completed').length
                  const sessionsLeft = Math.max(0, totalSessions - completedSessions)
                  const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
                  
                  const today = new Date()
                  const todayYmd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
                  const nextScheduleEntry = schedule.find((s) => s.status !== 'completed' && s.date >= todayYmd)
                  const nextVisitText = nextScheduleEntry
                    ? `${nextScheduleEntry.date} · ${nextScheduleEntry.time || activeBooking.timeSlot || ''} · At Home`
                    : activeBooking.date
                      ? `${activeBooking.date} · ${activeBooking.timeSlot || ''} · At Home`
                      : 'To be scheduled'

                  const physioName = typeof activeBooking.physioId === 'object' && activeBooking.physioId?.name
                    ? activeBooking.physioId.name
                    : null

                  return (
                    <div className="grid gap-6 lg:grid-cols-12 items-center">
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active Recovery Plan
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {sessionsLeft} of {totalSessions} sessions left
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {activeBooking.issue || 'Home Visit Therapy'}
                        </h3>
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-teal-600 h-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                          </div>
                          <p className="text-xs font-semibold text-slate-500">
                            {progressPct}% completed ({completedSessions} sessions done)
                          </p>
                        </div>
                      </div>

                      <div className="lg:col-span-5 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-sm font-bold shrink-0">
                            <Stethoscope size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {physioName ? (physioName.startsWith('Dr') ? physioName : `Dr. ${physioName}`) : 'Specialist Assigned'}
                            </p>
                            <p className="text-xs text-slate-500 font-medium truncate">Next Visit: {nextVisitText}</p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <a
                            href="tel:+918453580556"
                            className="flex-1 sm:flex-initial inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <PhoneCall size={11} />
                            Help Desk
                          </a>
                          <Link
                            to={`/dashboard/bookings/${activeBooking._id}`}
                            className="flex-1 sm:flex-initial inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
                          >
                            Schedule
                            <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              /* LOGGED IN BUT NO BOOKINGS */
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <HeartPulse size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Start your recovery plan today</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Schedule a verified clinician visit and begin rehabilitation in clinical comfort.</p>
                  </div>
                </div>
                <Link
                  to="/book"
                  className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-teal-600 px-6 text-sm font-semibold text-white shadow hover:bg-teal-700 shrink-0 w-full sm:w-auto"
                >
                  Book a Session
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>

{/* ══════════════════════════════════════════════════════════════
    ADVANCED THERAPEUTIC TECHNIQUES
══════════════════════════════════════════════════════════════ */}
<section className="py-20 bg-slate-50 border-b border-slate-200">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeading
      labelIcon={Stethoscope}
      label="Advanced Therapeutic Techniques"
      title="Specialized therapeutic methods"
      subtitle="Evidence-based advanced treatment techniques delivered to your home by our specialists."
      center
    />

    <div className="mt-14 overflow-x-auto pb-4 no-scrollbar">
      <div className="flex gap-6 sm:gap-8 min-w-max justify-start md:justify-center px-4">
        {TECHNIQUES.map((tech) => (
          <Link
            key={tech.title}
            to="/book"
            className="flex flex-col items-center w-[150px] text-center group cursor-pointer"
          >
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${tech.bg}`}>
              <img src={tech.image} alt={tech.title} className="w-[110px] h-[110px] object-contain" />
            </div>
            <span className={`text-sm font-bold mt-3 group-hover:opacity-80 transition-opacity ${tech.color}`}>
              {tech.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  </div>
</section>

        {/* ══════════════════════════════════════════════════════════════
            CLINICAL SPECIALTIES
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={Stethoscope}
              label="Clinical Specialities"
              title="Tailored clinical care plans"
              subtitle="Find highly targeted care programs built around specific physical symptoms."
              center
            />

            <div className="mt-14 overflow-x-auto pb-4 no-scrollbar">
              <div className="flex gap-4 sm:gap-6 min-w-max justify-start md:justify-center px-4">
                {SPECIALTIES.map((spec) => (
                  <Link
                    key={spec.title}
                    to={spec.id === 'Many More' ? '/book' : '/book'}
                    state={spec.id !== 'Many More' ? { selectedIssue: spec.id } : undefined}
                    className="flex flex-col items-center w-[150px] text-center group cursor-pointer"
                  >
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${spec.bg}`}>
                      <img src={spec.image} alt="" className="w-[96px] h-[96px] object-contain" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 mt-3 group-hover:text-teal-700 transition-colors">
                      {spec.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            PAIN ZONE GRID / ANATOMICAL MAP
        ══════════════════════════════════════════════════════════════ */}
        <section id="services" className="border-b border-slate-200 bg-slate-50 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
              <SectionHeading
                labelIcon={HeartPulse}
                label="Interactive diagnosis"
                title="Where do you need support?"
                subtitle="Select your symptoms directly on our anatomical blueprint or choose from common categories."
              />
              
              {/* Grid / Body Map toggle pills */}
              <div className="flex bg-slate-200/60 p-1.5 rounded-2xl shadow-inner shrink-0 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => { setPainViewMode('grid'); setSelectedSpot(null); }}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    painViewMode === 'grid'
                      ? 'bg-white text-teal-800 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity size={14} className={painViewMode === 'grid' ? 'text-teal-600' : ''} />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => { setPainViewMode('map'); setSelectedSpot(null); }}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    painViewMode === 'map'
                      ? 'bg-white text-teal-800 shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck size={14} className={painViewMode === 'map' ? 'text-teal-600' : ''} />
                  Body Map
                </button>
              </div>
            </div>

            {painViewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                {/* Back Pain */}
                <button
                  onClick={() => navigate('/book', { state: { selectedIssue: 'Back Pain' } })}
                  className="text-left rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-4/3 w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center p-3">
                    <img src={illustrationBackPain} alt="" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Lower Back</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Stiffness, spasm, sciatica, slip disc</p>
                    </div>
                    <ChevronRight size={15} className="text-slate-400 shrink-0" />
                  </div>
                </button>

                {/* Knee Pain */}
                <button
                  onClick={() => navigate('/book', { state: { selectedIssue: 'Knee Pain' } })}
                  className="text-left rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-4/3 w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center p-3">
                    <img src={illustrationKneePain} alt="" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Knee & Joint</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Arthritis, ligament strain, stiffness</p>
                    </div>
                    <ChevronRight size={15} className="text-slate-400 shrink-0" />
                  </div>
                </button>

                {/* Neck Pain */}
                <button
                  onClick={() => navigate('/book', { state: { selectedIssue: 'Neck Pain' } })}
                  className="text-left rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-4/3 w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center p-3">
                    <img src={illustrationNeckPain} alt="" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Neck & Spine</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Cervical pain, postural neck strain</p>
                    </div>
                    <ChevronRight size={15} className="text-slate-400 shrink-0" />
                  </div>
                </button>

                {/* Neuro Rehab */}
                <button
                  onClick={() => navigate('/book', { state: { selectedIssue: 'Neuro Rehab' } })}
                  className="text-left rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-4/3 w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center p-3">
                    <img src={illustrationNeuroRehab} alt="" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Stroke/Paralysis</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Stroke recovery, numbness, paralysis</p>
                    </div>
                    <ChevronRight size={15} className="text-slate-400 shrink-0" />
                  </div>
                </button>

                {/* Others */}
                <button
                  onClick={() => navigate('/book')}
                  className="text-left rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <div className="aspect-4/3 w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center p-3">
                    <img src={illustrationOther} alt="" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Others</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Any other physical conditions or post-op care</p>
                    </div>
                    <ChevronRight size={15} className="text-slate-400 shrink-0" />
                  </div>
                </button>
              </div>
            ) : (
              /* DUAL VIEWPORT BODY MAP SPLIT SCREEN */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden">
                
                {/* 1. Map Silhouette Box */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden h-[360px] w-full">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20 pointer-events-none">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className="border-t border-l border-slate-400" />
                    ))}
                  </div>

                  {/* Sweep scan bar overlay */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-80 scan-line-element pointer-events-none" />

                  {/* Body graphic block */}
                  <div className="relative w-[140px] h-[230px]">
                    {/* Head */}
                    <div className="w-[26px] h-[26px] rounded-full border-[1.5px] border-slate-300 bg-white absolute top-0 left-[57px]" />
                    {/* Neck */}
                    <div className="w-[6px] h-[12px] border-x-[1.5px] border-slate-300 bg-white absolute top-[26px] left-[67px] border-t-0 border-b-0" />
                    {/* Shoulders */}
                    <div className="w-[76px] h-[12px] rounded border-[1.5px] border-slate-300 bg-white absolute top-[36px] left-[32px]" />
                    {/* Torso */}
                    <div className="w-[56px] h-[72px] rounded-[10px] border-[1.5px] border-slate-300 bg-white absolute top-[46px] left-[42px]" />
                    {/* Arm Left */}
                    <div className="w-[10px] h-[60px] rounded-full border-[1.5px] border-slate-300 bg-white absolute top-[46px] left-[20px]" />
                    {/* Arm Right */}
                    <div className="w-[10px] h-[60px] rounded-full border-[1.5px] border-slate-300 bg-white absolute top-[46px] left-[110px]" />
                    {/* Hips */}
                    <div className="w-[52px] h-[16px] rounded border-[1.5px] border-slate-300 bg-white absolute top-[116px] left-[44px]" />
                    {/* Leg Left */}
                    <div className="w-[15px] h-[86px] rounded-full border-[1.5px] border-slate-300 bg-white absolute top-[130px] left-[48px]" />
                    {/* Leg Right */}
                    <div className="w-[15px] h-[86px] rounded-full border-[1.5px] border-slate-300 bg-white absolute top-[130px] left-[77px]" />
                    {/* Spine Line (Back view only) */}
                    {bodyViewSide === 'back' && (
                      <div className="w-[2px] h-[64px] bg-slate-200 absolute top-[50px] left-[69px]" />
                    )}

                    {/* Glowing hotspots */}
                    {(bodyViewSide === 'front' ? FRONT_SPOTS : BACK_SPOTS).map((spot) => {
                      const active = selectedSpot?.id === spot.id
                      const borderColorVal = active ? getPainColor(selectedPainScale) : '#0d6b6b'
                      const bgColorVal = active ? getPainBgColor(selectedPainScale) : 'rgba(13, 107, 107, 0.15)'
                      const innerBgColorVal = active ? getPainColor(selectedPainScale) : '#0d6b6b'

                      return (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() => handleSpotSelect(spot)}
                          style={{ top: spot.top, left: spot.left }}
                          className={`absolute w-[20px] h-[20px] rounded-full -ml-[10px] -mt-[10px] z-10 flex items-center justify-center cursor-pointer transition-all duration-300 focus:outline-none ${
                            active ? 'scale-115 shadow-md' : 'hover:scale-105'
                          }`}
                        >
                          <div
                            style={{ borderColor: borderColorVal, backgroundColor: bgColorVal }}
                            className="w-full h-full rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300"
                          >
                            <div
                              style={{ backgroundColor: innerBgColorVal }}
                              className="w-[6px] h-[6px] rounded-full transition-all duration-300"
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Front / Back selection toggle */}
                  <div className="flex bg-slate-200/60 p-1 rounded-xl shadow-inner mt-6 shrink-0 relative z-20">
                    <button
                      type="button"
                      onClick={() => { setBodyViewSide('front'); setSelectedSpot(null); }}
                      className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        bodyViewSide === 'front' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Front View
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBodyViewSide('back'); setSelectedSpot(null); }}
                      className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        bodyViewSide === 'back' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Back View
                    </button>
                  </div>
                </div>

                {/* 2. Interactive Details Panel */}
                <div className="lg:col-span-7 flex flex-col justify-center">
                  {selectedSpot ? (
                    <div className="border border-teal-100 bg-teal-50/10 rounded-2xl p-5 md:p-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-teal-100/50 text-teal-700 flex items-center justify-center shadow-sm shrink-0">
                          <selectedSpot.icon size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">{selectedSpot.name}</h4>
                          <p className="text-xs text-slate-500 font-semibold">{selectedSpot.desc}</p>
                        </div>
                      </div>

                      {/* Pain Slider */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pain Intensity Scale</h5>
                            <p className="text-[11px] text-slate-400 font-semibold">Select level 1 (mild) to 10 (extreme)</p>
                          </div>
                          
                          {/* Reactive bubble */}
                          <div
                            style={{ borderColor: getPainColor(selectedPainScale) + '40', backgroundColor: getPainBgColor(selectedPainScale) }}
                            className="flex items-center gap-2 border px-3 py-1 rounded-xl shadow-sm transition-all duration-300"
                          >
                            <span className="text-xl">{getPainEmoji(selectedPainScale)}</span>
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 leading-none">Intensity</p>
                              <p style={{ color: getPainColor(selectedPainScale) }} className="text-xs font-extrabold mt-0.5 leading-none">
                                {selectedPainScale} - {getPainLabel(selectedPainScale)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Slider buttons */}
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const isSelected = selectedPainScale === num
                            const activeColor = getPainColor(num)
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handlePainScaleChange(num)}
                                style={isSelected ? { backgroundColor: activeColor, borderColor: activeColor, boxShadow: `0 4px 6px ${activeColor}30` } : {}}
                                className={`h-9 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? 'text-white scale-105 shadow'
                                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:border-slate-200'
                                }`}
                              >
                                {num}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 pt-1">
                          <span>MILD</span>
                          <span>MODERATE</span>
                          <span>SEVERE</span>
                          <span>EXTREME</span>
                        </div>
                      </div>

                      {/* Clinical guidelines */}
                      <div
                        style={{ backgroundColor: getPainBgColor(selectedPainScale) }}
                        className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 shadow-sm"
                      >
                        <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: getPainColor(selectedPainScale) }} />
                        <div>
                          <h6 style={{ color: getPainColor(selectedPainScale) }} className="text-xs font-extrabold uppercase tracking-wider">
                            Rehab Guide: {getClinicalGuideTitle(selectedPainScale)}
                          </h6>
                          <p className="text-xs leading-relaxed text-slate-600 font-medium mt-1">
                            {getClinicalGuideDesc(selectedPainScale)}
                          </p>
                        </div>
                      </div>

                      {/* CTA Redirection */}
                      <Link
                        to="/book"
                        state={{ selectedIssue: selectedSpot.issue, painRating: selectedPainScale }}
                        style={{ backgroundColor: getPainColor(selectedPainScale) }}
                        className="flex w-full items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Find Doctors for {selectedSpot.issue}
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                        <Activity size={20} className="animate-pulse" />
                      </div>
                      <h4 className="font-bold text-slate-700 text-sm">Select body joint coordinates</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Click on any pulsing joint hotspot on the silhouette outline to view customized pain metrics.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}
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

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 w-full">
              {/* Step 1 */}
              <div className="glass-card group relative rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all">
                <div className="absolute top-[2.8rem] -right-4 hidden h-0.5 w-8 bg-teal-100 md:block" aria-hidden />
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow-md">
                    1
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-100/50">
                    <Search size={18} className="text-teal-700" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Book Online</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">Choose your preferred date, share physical concerns, and confirm slots in minutes.</p>
                <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  <Sparkles size={9} /> Instant Confirmation
                </div>
              </div>

              {/* Step 2 */}
              <div className="glass-card group relative rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all">
                <div className="absolute top-[2.8rem] -right-4 hidden h-0.5 w-8 bg-teal-100 md:block" aria-hidden />
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow-md">
                    2
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-100/50">
                    <Users size={18} className="text-teal-700" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Get Matched</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">We assign an MPT/BPT verified clinical physiotherapist specializing in your condition.</p>
                <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  <ShieldCheck size={9} /> Verified Graduates
                </div>
              </div>

              {/* Step 3 */}
              <div className="glass-card group relative rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-all">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-bold text-white shadow-md">
                    3
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-100/50">
                    <Home size={18} className="text-teal-700" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Recover At Home</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">Receive regular physical treatment at home. Log all daily session summaries in-app.</p>
                <div className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  <Activity size={9} /> Interactive Progress
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            HOME CARE PLANS (pricing plans)
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={CreditCard}
              label="Flexible packages"
              title="Physiotherapy Plans"
              subtitle="Save with structured subscription terms matching long term muscle rehabilitation timelines."
              center
            />

            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 max-w-4xl mx-auto w-full">
              {PLAN_TIER_CARDS.map((plan, idx) => {
                const IconComponent = plan.icon
                return (
                  <div
                    key={idx}
                    className={`rounded-3xl border p-6 flex flex-col justify-between hover:shadow-md transition-all ${plan.bg} ${plan.border}`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${plan.color} bg-white border border-slate-100`}>
                          {plan.badge}
                        </span>
                        {plan.saveCallout && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            {plan.saveCallout}
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xl font-extrabold ${plan.titleColor}`}>{plan.label}</h4>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">{plan.desc}</p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-teal-600 shadow-sm shrink-0">
                          <IconComponent size={14} className={plan.color} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{plan.sessions} Home Visits</span>
                      </div>
                      <Link
                        to="/book"
                        className="text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors"
                      >
                        Book now →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FEATURED PHYSIOS
        ══════════════════════════════════════════════════════════════ */}
        <FeaturedPhysiosSection />

        {/* ══════════════════════════════════════════════════════════════
            CARE COMPARISON (Commute vs. Comfort)
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white py-20 lg:py-24 border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={Star}
              label="Care Comparison"
              title="Commute vs. Comfort"
              subtitle="See how PhysiOkhom transforms your rehabilitation experience compared to traditional clinic commuting."
              center
            />

            <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 w-full">
              {/* Clinic Commute */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 shrink-0">
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
                    'Wasted time sitting in noisy waiting rooms',
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 border border-teal-200 shadow-sm shrink-0">
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
            WHATSAPP CARE CONCIERGE
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-8 bg-slate-50 border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4">
            <a
              href="https://wa.me/918453580556?text=Hello%20PhysiOkhom%2C%20I%20need%20assistance%20with%20booking%20a%20physiotherapist%20session."
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl shadow-sm border border-emerald-500/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md shrink-0 text-emerald-600 group-hover:scale-105 transition-transform">
                  <MessageSquare size={22} className="fill-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h4 className="font-extrabold text-base">WhatsApp Care Concierge</h4>
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500 px-2 py-0.5 rounded-full border border-emerald-400">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Online
                    </span>
                  </div>
                  <p className="text-emerald-100 text-xs mt-1 max-w-md">
                    Need help matching symptoms with the right therapist? Chat directly with our medical coordinate team 24/7.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center gap-1 text-sm font-extrabold bg-white text-emerald-700 px-4 py-2.5 rounded-xl shadow-sm shrink-0 hover:bg-emerald-50">
                Chat on WhatsApp
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════════════════════ */}
        <section className="border-b border-slate-200 bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              labelIcon={MessageSquare}
              label="Patient Reviews"
              title="Stories of Recovery"
              center
            />

            <div className="mt-14 relative">
              <div className="glass-card rounded-3xl p-8 md:p-10 shadow-lg relative border border-slate-100 overflow-hidden bg-white">
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

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100 justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-teal-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Verified Recovery Patient</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{testimonials[testimonialIndex].sessions}</span>
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
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
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
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
                    aria-label="Previous review"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setTestimonialIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
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
            SAFETY PROMISE & SHIELD
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-slate-900 py-20 text-white relative overflow-hidden border-y border-slate-800">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-[60%] bg-teal-500/10 rounded-full blur-[100px]" aria-hidden />

          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative text-center flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-6 shadow-lg shadow-teal-500/5">
              <Shield size={24} className="animate-pulse" />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              The PhysiOkhom At-Home Safety Promise
            </h2>
            <p className="mt-4 max-w-2xl text-slate-455 text-sm leading-relaxed">
              We understand welcoming a professional into your home requires absolute trust. We maintain strict criteria to guarantee safety, verification, and clinical compliance.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-4 text-left w-full">
              {[
                { title: 'Credential Checked', desc: 'Verified MPT/BPT medical graduates with clinical credentials.' },
                { title: 'Background Verified', desc: 'Clean professional background check verification checks prior to platform approval.' },
                { title: 'GPS Logged Sessions', desc: 'Secure appointments are fully monitored with location status check-ins.' },
                { title: 'Sanitized Equipment', desc: 'Portable gear and elements sanitized before entering your home.' }
              ].map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-md">
                  <h3 className="text-sm font-bold text-teal-400">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400 font-semibold">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            TRUST METRICS
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-10 bg-slate-50 border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TRUSTED BY LEADING CARE NETWORKS</p>
            <div className="flex justify-center items-center gap-8 mt-5 flex-wrap text-slate-500 font-bold text-sm">
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="text-teal-600 w-4.5 h-4.5" />
                <span>ISO 9001 Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Stethoscope className="text-teal-600 w-4.5 h-4.5" />
                <span>100% BPT/MPT Grads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="text-teal-600 w-4.5 h-4.5 fill-teal-600/10" />
                <span>4.9/5 Average Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FAQ CATEGORIZED ACCORDION
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

            {/* FAQ Category Tab Filters */}
            <div className="flex justify-center bg-slate-200/50 p-1 rounded-2xl max-w-sm mx-auto mt-8 mb-10 border border-slate-200/40">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setActiveFaqCat(cat); setOpenFaq(null); }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFaqCat === cat
                      ? 'bg-white text-teal-800 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((item, i) => (
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
            JOIN AS PHYSIO BANNER
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-slate-50 py-10 border-b border-slate-200">
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
                <p className="mt-1 text-sm text-slate-500 font-semibold">
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

            <ul className="mx-auto mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 w-full">
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
              <p className="mt-2 text-sm leading-relaxed text-slate-600 font-semibold">
                People often search for{' '}
                <Link to="/physio-in/bongaigaon" className="font-bold text-teal-700 hover:underline">
                  physio in Bongaigaon
                </Link>{' '}
                and{' '}
                <Link to="/physio-in/kokrajhar" className="font-bold text-teal-700 hover:underline">
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
            FINAL CTA
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-slate-900 py-20 text-white lg:py-24">
          <div className="absolute -top-1/4 -right-1/4 h-[70%] w-[50%] bg-teal-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-1/4 -left-1/4 h-[70%] w-[50%] bg-emerald-500/10 rounded-full blur-[100px]" />

          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300">
              <MapPin size={12} className="animate-pulse" />
              Available in your region
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
              Ready to recover?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-300 text-sm leading-relaxed">
              Register with your phone, pick an available slot, confirm your appointment — we handle the rest.
            </p>
            
            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center max-w-sm mx-auto sm:max-w-none">
              <Link
                to="/book"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 text-base font-semibold text-white shadow-lg hover:bg-teal-700"
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
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 shadow-md">
                  <Activity size={16} className="text-white" />
                </span>
                <span className="text-[15px] font-bold tracking-tight">PhysiOkhom</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400 font-semibold">
                Home visit physiotherapy services across Lower Assam. Vetted doctors, simple scheduling, transparent packages.
              </p>
              <p className="mt-5 text-[10px] text-slate-500 font-semibold">
                &copy; {new Date().getFullYear()} PhysiOkhom. All rights reserved.
              </p>
            </div>

            {/* For patients */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">For Patients</p>
              <nav className="flex flex-col gap-2.5 text-xs font-semibold text-slate-400">
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
              <nav className="flex flex-col gap-2.5 text-xs font-semibold text-slate-400">
                <Link to="/register-physio" className="transition-colors hover:text-white">Join as physiotherapist</Link>
                <Link to="/login" className="transition-colors hover:text-white">Physio sign in</Link>
              </nav>
            </div>

            {/* Cities */}
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Service Regions</p>
              <nav className="flex flex-col gap-2.5 text-xs font-semibold text-slate-400">
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
