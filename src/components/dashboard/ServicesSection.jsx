import { useState } from 'react'
import { Link } from 'react-router-dom'

import { ISSUE_OTHER_SENTINEL } from '../../constants/issues'
import { getTechniqueByIssue } from '../../constants/techniques'
import PainBodyMapPanel from '../booking/PainBodyMapPanel'
import PainViewModeToggle from '../booking/PainViewModeToggle'

import imgCupping    from '../../assets/technique_cupping.png'
import imgNeedling   from '../../assets/technique_needling.png'
import imgKinesio    from '../../assets/technique_kinesio.png'
import imgIastm      from '../../assets/technique_iastm.png'
import imgOrthopedic from '../../assets/specialty_orthopedic.png'
import imgNeuro      from '../../assets/specialty_neuro.png'
import imgPediatric  from '../../assets/illustration_pediatric.png'
import imgPostOp     from '../../assets/specialty_post_op.png'
import imgElderly    from '../../assets/technique_elderly.png'
import imgOtherSpec  from '../../assets/specialty_other.png'
import imgBackPain   from '../../assets/illustration_back_pain.png'
import imgKneePain   from '../../assets/illustration_knee_pain.png'
import imgNeckPain   from '../../assets/illustration_neck_pain.png'
import imgStroke     from '../../assets/illustration_neuro_rehab.png'
import imgOther      from '../../assets/illustration_other.png'

const CONDITIONS = [
  { label: 'Lower Back',       subtitle: 'Stiffness, slip disc, spasm, backache',      issue: 'Lower Back Pain',    image: imgBackPain, color: '#dc2626', bg: '#fff1ee', border: '#fdd0c0' },
  { label: 'Knee & Joint',     subtitle: 'Ligament injury, arthritis, stiffness',       issue: 'Knee & Joint Pain',  image: imgKneePain, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { label: 'Neck & Spine',     subtitle: 'Cervical pain, frozen shoulder, strain',      issue: 'Neck & Spine Pain',  image: imgNeckPain, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Stroke/Paralysis', subtitle: 'Stroke recovery, paralysis care, numbness',   issue: 'Stroke / Paralysis', image: imgStroke,   color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
  { label: 'Others',           subtitle: 'Post-op care, sports injury, general rehab',  issue: ISSUE_OTHER_SENTINEL, image: imgOther,    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
]

const TECHNIQUES = [
  { label: 'Cupping Therapy', issue: 'Cupping Therapy', image: imgCupping,  color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { label: 'Dry Needling',    issue: 'Dry Needling',    image: imgNeedling, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Kinesio Taping',  issue: 'Kinesio Taping',  image: imgKinesio,  color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { label: 'IASTM',           issue: 'IASTM',           image: imgIastm,    color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', imgClass: 'scale-110' },
]

const SPECIALTIES = [
  { label: 'Orthopedic',   issue: 'Orthopedic Care', image: imgOrthopedic },
  { label: 'Neuro Rehab',  issue: 'Neuro Rehab',     image: imgNeuro      },
  { label: 'Pediatric',    issue: 'Pediatric Rehab', image: imgPediatric  },
  { label: 'Post-Op',      issue: 'Post-Op Rehab',   image: imgPostOp     },
  { label: 'Elderly Care', issue: 'Elderly Care',    image: imgElderly    },
  { label: 'Other Care',   issue: ISSUE_OTHER_SENTINEL, image: imgOtherSpec  },
]

function bookTo(issue) {
  return { to: '/book', state: issue ? { selectedIssue: issue } : undefined }
}

function techniqueTo(issue) {
  const tech = getTechniqueByIssue(issue)
  if (tech) return { to: `/techniques/${tech.slug}` }
  return bookTo(issue)
}

/* ── Technique card — compact portrait card, coloured top border ── */
function TechniqueCard({ item }) {
  const { to } = techniqueTo(item.issue)
  return (
    <Link
      to={to}
      className="group flex flex-1 flex-col items-center gap-2 overflow-hidden rounded-xl border bg-white pb-3 pt-0 shadow-sm transition-shadow hover:shadow-md active:opacity-80"
      style={{ borderColor: item.border }}
    >
      {/* Coloured top strip */}
      <div className="flex h-20 w-full items-end justify-center overflow-hidden" style={{ background: item.bg }}>
        <img
          src={item.image}
          alt={item.label}
          className={`h-16 w-16 object-contain object-bottom ${item.imgClass || ''}`}
        />
      </div>
      <span className="px-2 text-center text-[11px] font-bold leading-tight" style={{ color: item.color }}>
        {item.label}
      </span>
    </Link>
  )
}

/* ── Condition card — portrait, horizontal scroll ── */
function ConditionCard({ item }) {
  const { to, state } = bookTo(item.issue)
  return (
    <Link
      to={to}
      state={state}
      className="group flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md active:opacity-90"
      style={{ borderColor: item.border ?? '#e2e8f0' }}
    >
      {/* Tinted image area */}
      <div className="flex h-24 w-full items-end justify-center overflow-hidden" style={{ background: item.bg }}>
        <img src={item.image} alt={item.label} className="h-20 w-full object-contain object-bottom" />
      </div>

      {/* Text */}
      <div className="flex flex-1 flex-col justify-between px-2.5 py-2">
        <div>
          <p className="text-[12px] font-bold leading-tight" style={{ color: item.color }}>{item.label}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-400 line-clamp-2">{item.subtitle}</p>
        </div>
        <div className="mt-1.5 flex items-center gap-0.5">
          <span className="text-[10px] font-semibold" style={{ color: item.color }}>Book</span>
          <svg className="h-3 w-3" fill="none" stroke={item.color} strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

/* ── Service chip — uniform circle + label, horizontal scroll ── */
function ServiceChip({ item }) {
  const { to, state } = bookTo(item.issue)
  return (
    <Link
      to={to}
      state={state}
      className="flex shrink-0 flex-col items-center gap-1.5 active:opacity-70"
    >
      <div className="flex h-13 w-13 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-slate-50 shadow-sm">
        <img src={item.image} alt={item.label} className="h-9 w-9 object-contain" />
      </div>
      <span className="max-w-14 text-center text-[10px] font-semibold leading-tight text-slate-500">
        {item.label}
      </span>
    </Link>
  )
}

export default function ServicesSection({
  variant = 'full',
  title = 'Book by Need',
  intro = null,
}) {
  const [viewMode, setViewMode] = useState('grid')
  const compact = variant === 'compact'

  return (
    <section aria-labelledby="services-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
            </div>
            <h2 id="services-heading" className="text-sm font-bold text-slate-900">{title}</h2>
          </div>
          {intro ? <p className="mt-1 text-xs text-slate-500">{intro}</p> : null}
        </div>
        {!compact ? (
          <PainViewModeToggle mode={viewMode} onChange={(mode) => setViewMode(mode)} />
        ) : null}
      </div>

      {!compact && viewMode === 'map' ? (
        <PainBodyMapPanel bookCtaLabel={(issue) => `Book for ${issue}`} />
      ) : (
        <>
          <div>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Treatment Techniques
            </p>
            <div className="flex gap-2.5">
              {TECHNIQUES.map((t) => (
                <TechniqueCard key={t.label} item={t} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Conditions We Treat
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {CONDITIONS.map((c) => (
                <ConditionCard key={c.label} item={c} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Care Specialties
            </p>
            <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {SPECIALTIES.map((s) => (
                <ServiceChip key={s.label} item={s} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
