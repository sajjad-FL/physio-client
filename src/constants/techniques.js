/**
 * Treatment techniques for Book-by-Need detail pages and direct home or clinic booking.
 * `bookingIssue` must match ISSUE_OPTIONS / server TECHNIQUE_ISSUES.
 * Images live in `public/images/` (stable URLs for production).
 */
const imgCupping = '/images/technique_cupping.png'
const imgNeedling = '/images/technique_needling.png'
const imgKinesio = '/images/technique_kinesio.png'
const imgIastm = '/images/technique_iastm.png'

export const TECHNIQUES = [
  {
    slug: 'cupping-therapy',
    label: 'Cupping Therapy',
    bookingIssue: 'Cupping Therapy',
    image: imgCupping,
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
    intro:
      'Cupping uses gentle suction cups on the skin to ease muscle tension, improve local blood flow, and support recovery from stiffness and overuse.',
    expect: [
      'A short assessment of the painful or tight area',
      'Cups placed for a few minutes (often with a warm sensation)',
      'After-care tips for the same day',
    ],
    faq: [
      {
        q: 'Does cupping leave marks?',
        a: 'Light circular marks are common and usually fade in a few days. Your physiotherapist explains what to expect before starting.',
      },
      {
        q: 'Is it painful?',
        a: 'Most people feel pressure or warmth, not sharp pain. Intensity is adjusted to your comfort.',
      },
    ],
  },
  {
    slug: 'dry-needling',
    label: 'Dry Needling',
    bookingIssue: 'Dry Needling',
    image: imgNeedling,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    intro:
      'Dry needling uses fine sterile needles to release tight muscle trigger points and reduce referred pain — often for neck, back, and shoulder tightness.',
    expect: [
      'Consent and a clear explanation of the technique',
      'Brief needle insertion into targeted trigger points',
      'Gentle movement or stretch advice afterward',
    ],
    faq: [
      {
        q: 'Is dry needling the same as acupuncture?',
        a: 'No. Dry needling is based on Western anatomy and trigger-point theory; acupuncture follows traditional Chinese medicine meridians.',
      },
      {
        q: 'Will I be sore afterward?',
        a: 'Mild muscle ache for a day is common. Your physio will advise ice, heat, or light activity as needed.',
      },
    ],
  },
  {
    slug: 'kinesio-taping',
    label: 'Kinesio Taping',
    bookingIssue: 'Kinesio Taping',
    image: imgKinesio,
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4',
    intro:
      'Kinesiology tape supports muscles and joints while you move — useful for sports, posture strain, and mild swelling.',
    expect: [
      'Skin prep and placement mapped to your injury or goal',
      'Tape applied so you can still move freely',
      'Wear-time guidance (often 2–5 days)',
    ],
    faq: [
      {
        q: 'Can I shower with the tape on?',
        a: 'Usually yes — pat dry afterward. Your physiotherapist will confirm based on the tape used.',
      },
      {
        q: 'Does the tape replace exercises?',
        a: 'No. Tape supports recovery; exercises and load management remain the core of rehab.',
      },
    ],
  },
  {
    slug: 'iastm',
    label: 'IASTM',
    bookingIssue: 'IASTM',
    image: imgIastm,
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    intro:
      'IASTM (Instrument Assisted Soft Tissue Mobilization) uses specialized tools to break down scar tissue, ease fascial restrictions, and improve mobility in tight or overused areas.',
    expect: [
      'Assessment of restricted soft tissue',
      'Tool-assisted strokes over the affected area',
      'Follow-up mobility drills or stretching',
    ],
    faq: [
      {
        q: 'Will my skin get red?',
        a: 'Temporary redness is common. Significant bruising should be rare when pressure is controlled.',
      },
      {
        q: 'Who is IASTM for?',
        a: 'People with chronic tightness, tendon irritation, or post-injury scar restrictions often benefit — your physio decides if it fits your case.',
      },
    ],
  },
]

export function getTechniqueBySlug(slug) {
  return TECHNIQUES.find((t) => t.slug === slug) || null
}

export function getTechniqueByIssue(issue) {
  const key = String(issue || '').trim().toLowerCase()
  if (!key) return null
  return TECHNIQUES.find((t) => String(t.bookingIssue).toLowerCase() === key) || null
}
