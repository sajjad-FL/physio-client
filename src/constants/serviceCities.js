/**
 * Assam districts / towns where PhysiOkhom markets home visit physiotherapy.
 *
 * Used by:
 *  - City landing pages at /physio-in/<slug>
 *  - Homepage "cities we serve" section
 *  - Sitemap generation (vite.config.js seoDistFilesPlugin)
 *  - LocalBusiness JSON-LD areaServed arrays
 *
 * Initial launch is limited to Kokrajhar. Expand as real coverage grows.
 */
export const SERVICE_CITIES = [
  {
    slug: 'kokrajhar',
    name: 'Kokrajhar',
    state: 'Assam',
    district: 'Kokrajhar',
    lat: 26.4008,
    lng: 90.2711,
    tagline:
      'Verified home visit physiotherapists serving Kokrajhar town, Gossaigaon, Dotma, Salakati, Fakiragram and other Kokrajhar localities.',
    seoHighlights: [
      'physiotherapist in Kokrajhar',
      'physiotherapist in Kokrajhar Assam',
      'home physiotherapy near me in Kokrajhar district',
      'physio in Kokrajhar',
      'physio home Kokrajhar',
      'physio home Assam',
      'physio home',
      'home visit physiotherapist Kokrajhar',
      'physiotherapist at home Kokrajhar',
    ],
    seoIntro:
      'Across Kokrajhar and nearby neighborhoods, PhysiOkhom helps patients access verified home physiotherapy with convenient booking and clear pricing.',
    neighborhoods: [
      'Kokrajhar Town',
      'Gossaigaon',
      'Dotma',
      'Salakati',
      'Fakiragram',
      'Serfanguri',
      'Titaguri',
      'Kachugaon',
      'Bhowraguri',
      'Balajan',
    ],
  },
]

export const CITY_SLUGS = SERVICE_CITIES.map((c) => c.slug)

export function findCityBySlug(slug) {
  if (!slug) return null
  const needle = String(slug).trim().toLowerCase()
  return SERVICE_CITIES.find((c) => c.slug === needle) || null
}
