import imgCupping from '../assets/technique_cupping.png'
import imgNeedling from '../assets/technique_needling.png'
import imgKinesio from '../assets/technique_kinesio.png'
import imgIastm from '../assets/technique_iastm.png'

/**
 * Treatment techniques for Book-by-Need detail pages and direct home or clinic booking.
 * `bookingIssue` must match ISSUE_OPTIONS / server TECHNIQUE_ISSUES.
 */
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
        q: 'Is this a clinic visit or at home?',
        a: 'You can book either a home visit or a clinic visit. If you already have an active recovery plan with a care manager, they handle physio assignment. Otherwise our team assigns a physiotherapist directly.',
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
      'Dry needling targets tight muscle trigger points with fine sterile needles to reduce pain and restore movement.',
    expect: [
      'Discussion of your symptoms and any needle concerns',
      'Precise needling of selected muscle points',
      'Gentle movement advice afterwards',
    ],
    faq: [
      {
        q: 'Is dry needling the same as acupuncture?',
        a: 'They use similar needles but different clinical goals. Dry needling focuses on muscle trigger points based on physiotherapy assessment.',
      },
      {
        q: 'Will it hurt?',
        a: 'You may feel a brief twitch or ache. Most people find it tolerable; tell your physiotherapist if anything feels too sharp.',
      },
      {
        q: 'Is this a clinic visit or at home?',
        a: 'You can book either a home visit or a clinic visit. If you already have an active recovery plan with a care manager, they handle physio assignment. Otherwise our team assigns a physiotherapist directly.',
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
      'Assessment of the area that needs support',
      'Skin-safe tape applied in a specific pattern',
      'Guidance on wear time and activity',
    ],
    faq: [
      {
        q: 'How long does the tape stay on?',
        a: 'Often 3–5 days depending on activity and skin sensitivity. Your physiotherapist will advise for your case.',
      },
      {
        q: 'Can I shower with it on?',
        a: 'Yes, with care — pat dry rather than rub. Avoid oils and lotions on the taped skin.',
      },
      {
        q: 'Is this a clinic visit or at home?',
        a: 'You can book either a home visit or a clinic visit. If you already have an active recovery plan with a care manager, they handle physio assignment. Otherwise our team assigns a physiotherapist directly.',
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
      'Assessment of the restricted or painful soft tissue',
      'Tool-assisted strokes along the muscle and fascia (often with redness)',
      'After-care tips for soreness and activity the same day',
    ],
    faq: [
      {
        q: 'Will my skin look red afterwards?',
        a: 'Mild redness is common and usually settles within a day or two. Your physiotherapist adjusts pressure to your comfort.',
      },
      {
        q: 'Is this a clinic visit or at home?',
        a: 'You can book either a home visit or a clinic visit. If you already have an active recovery plan with a care manager, they handle physio assignment. Otherwise our team assigns a physiotherapist directly.',
      },
    ],
  },
]

export function getTechniqueBySlug(slug) {
  return TECHNIQUES.find((t) => t.slug === String(slug || '').trim()) || null
}

export function getTechniqueByIssue(issue) {
  const key = String(issue || '').trim()
  return TECHNIQUES.find((t) => t.bookingIssue === key) || null
}
