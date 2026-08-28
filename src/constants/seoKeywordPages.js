/**
 * Additive SEO keyword landing pages (do not replace existing /physio-in/:city SEO).
 * Target phrases: physio home, physio home Assam, physio home Kokrajhar, physio in Kokrajhar.
 */
export const SEO_KEYWORD_PAGES = [
  {
    slug: 'physio-home',
    path: '/physio-home',
    title: 'Physio Home Visit in Assam — Book at Home | PhysiOkhom',
    h1: 'Physio home visit — verified physiotherapists at your door',
    description:
      'Book physio home visits across Assam with PhysiOkhom. Care Manager–led assessment, clear care plan, then verified home physiotherapy for back pain, knee pain, post-surgery rehab and more.',
    keywords: [
      'physio home',
      'physio home visit',
      'home physio',
      'physiotherapist at home',
      'home visit physiotherapy',
      'physio home Assam',
    ],
    intro:
      'Physio home care with PhysiOkhom means a Care Manager visits first for a complimentary assessment, you approve the plan, then a verified physiotherapist continues treatment at home.',
    relatedCitySlug: null,
    bullets: [
      'Complimentary Care Manager home assessment',
      'Clear care plan before treatment starts',
      'Verified physiotherapists for home treatment visits',
      'Back pain, knee pain, post-surgery and stroke rehab',
    ],
  },
  {
    slug: 'physio-home-assam',
    path: '/physio-home-assam',
    title: 'Physio Home Assam — Home Visit Physiotherapy | PhysiOkhom',
    h1: 'Physio home Assam — home visit physiotherapy across the state',
    description:
      'Looking for physio home Assam services? PhysiOkhom offers Care Manager–led home physiotherapy in Assam, starting with Kokrajhar and nearby localities. Book a home visit online.',
    keywords: [
      'physio home Assam',
      'physio home in Assam',
      'home physiotherapy Assam',
      'physiotherapist at home Assam',
      'Assam home visit physio',
      'physio home',
    ],
    intro:
      'Physio home Assam coverage through PhysiOkhom starts where our Care Managers and therapists are active — book online, share your Assam address, and we schedule the nearest available team.',
    relatedCitySlug: 'kokrajhar',
    bullets: [
      'Home physiotherapy focused on Assam patients',
      'Local Care Managers who know your area',
      'Transparent packages before you start treatment',
      'Serving Kokrajhar district and expanding coverage',
    ],
  },
  {
    slug: 'physio-home-kokrajhar',
    path: '/physio-home-kokrajhar',
    title: 'Physio Home Kokrajhar — Home Visit Physiotherapist | PhysiOkhom',
    h1: 'Physio home Kokrajhar — home visit physiotherapist near you',
    description:
      'Book physio home Kokrajhar visits with PhysiOkhom. Verified home physiotherapy in Kokrajhar town, Gossaigaon, Dotma, Salakati, Fakiragram and nearby areas.',
    keywords: [
      'physio home Kokrajhar',
      'physio home in Kokrajhar',
      'home physio Kokrajhar',
      'physiotherapist at home Kokrajhar',
      'home visit physiotherapy Kokrajhar',
      'physio Kokrajhar',
    ],
    intro:
      'Physio home Kokrajhar patients use PhysiOkhom to book Care Manager–led home care — assessment at your address, then treatment visits from a verified physiotherapist in Kokrajhar and nearby localities.',
    relatedCitySlug: 'kokrajhar',
    bullets: [
      'Home visits across Kokrajhar town and nearby localities',
      'Care Manager assessment before treatment',
      'Ideal for elders, post-surgery recovery and chronic pain',
      'Easy online booking with clear next steps',
    ],
  },
]

export const SEO_KEYWORD_PATHS = SEO_KEYWORD_PAGES.map((p) => p.path)

export function findSeoKeywordPage(slug) {
  if (!slug) return null
  const needle = String(slug).trim().toLowerCase()
  return SEO_KEYWORD_PAGES.find((p) => p.slug === needle) || null
}
