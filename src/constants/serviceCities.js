/**
 * Assam districts / towns where NearbyPhysio markets home visit physiotherapy.
 *
 * Used by:
 *  - City landing pages at /physio-in/<slug>
 *  - Homepage "cities we serve" section
 *  - Sitemap generation (vite.config.js seoDistFilesPlugin)
 *  - LocalBusiness JSON-LD areaServed arrays
 *
 * Initial launch focuses on Lower Assam / BTR corridor: Guwahati, Barpeta,
 * Bongaigaon, Bijni and Kokrajhar. Expand as real coverage grows.
 */
export const SERVICE_CITIES = [
  {
    slug: 'guwahati',
    name: 'Guwahati',
    state: 'Assam',
    district: 'Kamrup Metropolitan',
    lat: 26.1445,
    lng: 91.7362,
    tagline:
      'Home visit physiotherapists across Dispur, Beltola, Six Mile, Zoo Road, Paltan Bazaar, Ganeshguri, Panjabari and more.',
    neighborhoods: [
      'Dispur',
      'Beltola',
      'Six Mile',
      'Zoo Road',
      'Paltan Bazaar',
      'Ganeshguri',
      'Panjabari',
      'Hatigaon',
      'Uzanbazar',
      'Maligaon',
    ],
  },
  {
    slug: 'barpeta',
    name: 'Barpeta',
    state: 'Assam',
    district: 'Barpeta',
    lat: 26.3221,
    lng: 91.0069,
    tagline:
      'Verified home visit physios serving Barpeta town, Barpeta Road, Howly, Sarthebari, Pathsala and other Barpeta district localities.',
    neighborhoods: [
      'Barpeta Town',
      'Barpeta Road',
      'Howly',
      'Sarthebari',
      'Pathsala',
      'Kalgachia',
      'Sarupeta',
      'Bhawanipur',
    ],
  },
  {
    slug: 'bongaigaon',
    name: 'Bongaigaon',
    state: 'Assam',
    district: 'Bongaigaon',
    lat: 26.4831,
    lng: 90.5565,
    tagline:
      'Book a physiotherapist at home in New Bongaigaon, Chapaguri Road, Barpara, Abhayapuri, Boitamari and more.',
    neighborhoods: [
      'New Bongaigaon',
      'Chapaguri Road',
      'Barpara',
      'Abhayapuri',
      'Boitamari',
      'Dangtol',
      'North Bongaigaon',
      'Jogighopa',
    ],
  },
  {
    slug: 'bijni',
    name: 'Bijni',
    state: 'Assam',
    district: 'Chirang',
    lat: 26.4883,
    lng: 90.6906,
    tagline:
      'Home visit physios across Bijni town, Dhaligaon, Runikhata, Amguri, Panbari and other Chirang localities around Bijni.',
    neighborhoods: [
      'Bijni Town',
      'Dhaligaon',
      'Runikhata',
      'Amguri',
      'Panbari',
      'Basugaon',
      'Sidli',
      'NH-31',
    ],
  },
  {
    slug: 'kokrajhar',
    name: 'Kokrajhar',
    state: 'Assam',
    district: 'Kokrajhar',
    lat: 26.4008,
    lng: 90.2711,
    tagline:
      'Verified home visit physios serving Kokrajhar town, Gossaigaon, Dotma, Salakati, Fakiragram and other Kokrajhar localities.',
    neighborhoods: [
      'Kokrajhar Town',
      'Gossaigaon',
      'Dotma',
      'Salakati',
      'Fakiragram',
      'Serfanguri',
      'Titaguri',
      'Kachugaon',
    ],
  },
]

export const CITY_SLUGS = SERVICE_CITIES.map((c) => c.slug)

export function findCityBySlug(slug) {
  if (!slug) return null
  const needle = String(slug).trim().toLowerCase()
  return SERVICE_CITIES.find((c) => c.slug === needle) || null
}
