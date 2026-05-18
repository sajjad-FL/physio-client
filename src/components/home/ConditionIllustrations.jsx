/**
 * PhysioKhom — Condition Illustrations
 * Professional medical SVGs for each condition card.
 * Fully scalable — safe to use in marketing, print, or social media.
 * Each component accepts a className prop (use w-full h-full, etc.)
 */

/* ─── Back Pain ─────────────────────────────────────────────────────────── */
export function BackPainIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Back pain illustration">
      <defs>
        <linearGradient id="bp-bg" x1="0" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0fdfa" />
          <stop offset="1" stopColor="#ccfbf1" />
        </linearGradient>
        <radialGradient id="bp-pain" cx="100" cy="104" r="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bp-center" cx="100" cy="75" r="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="200" height="150" fill="url(#bp-bg)" />
      <rect width="200" height="150" fill="url(#bp-center)" />

      {/* Decorative rings */}
      <circle cx="100" cy="75" r="58" stroke="#0d9488" strokeWidth="0.5" opacity="0.1" />
      <circle cx="100" cy="75" r="44" stroke="#0d9488" strokeWidth="0.5" opacity="0.1" />

      {/* Pain aura - lumbar region */}
      <ellipse cx="100" cy="104" rx="42" ry="26" fill="url(#bp-pain)" />

      {/* Cervical spine (top 3) */}
      <rect x="89" y="16" width="22" height="6" rx="2" fill="#0d9488" opacity="0.4" />
      <rect x="88" y="25" width="24" height="6" rx="2" fill="#0d9488" opacity="0.45" />
      <rect x="87" y="34" width="26" height="6" rx="2" fill="#0d9488" opacity="0.5" />

      {/* Thoracic spine (mid 4) */}
      <rect x="86" y="44" width="28" height="6.5" rx="2" fill="#0d9488" opacity="0.58" />
      <rect x="86" y="53.5" width="28" height="6.5" rx="2" fill="#0d9488" opacity="0.62" />
      <rect x="85" y="63" width="30" height="6.5" rx="2" fill="#0d9488" opacity="0.66" />
      <rect x="85" y="72.5" width="30" height="6.5" rx="2" fill="#0d9488" opacity="0.65" />

      {/* Lumbar spine — pain highlighted */}
      <rect x="83" y="83" width="34" height="8" rx="2.5" fill="#f59e0b" opacity="0.82" />
      <rect x="83" y="94" width="34" height="8" rx="2.5" fill="#f59e0b" opacity="0.88" />
      <rect x="84" y="105" width="32" height="8" rx="2.5" fill="#f59e0b" opacity="0.78" />

      {/* Sacrum */}
      <path d="M92 117 Q100 132 108 117" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />

      {/* Vertebrae connector lines */}
      <line x1="100" y1="22" x2="100" y2="25" stroke="#0d9488" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="31" x2="100" y2="34" stroke="#0d9488" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="40" x2="100" y2="44" stroke="#0d9488" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="50" x2="100" y2="53.5" stroke="#0d9488" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="59.5" x2="100" y2="63" stroke="#0d9488" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="69" x2="100" y2="72.5" stroke="#0d9488" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="79" x2="100" y2="83" stroke="#0d9488" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="91" x2="100" y2="94" stroke="#f59e0b" strokeWidth="1.5" opacity="0.45" />
      <line x1="100" y1="102" x2="100" y2="105" stroke="#f59e0b" strokeWidth="1.5" opacity="0.45" />
      <line x1="100" y1="113" x2="100" y2="117" stroke="#0d9488" strokeWidth="1.5" opacity="0.35" />

      {/* Transverse processes (lumbar) */}
      <line x1="83" y1="87" x2="68" y2="83" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="117" y1="87" x2="132" y2="83" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="83" y1="98" x2="66" y2="94" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="117" y1="98" x2="134" y2="94" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

      {/* Pain pulse indicators */}
      <circle cx="143" cy="91" r="7" stroke="#f59e0b" strokeWidth="1.5" opacity="0.25" />
      <circle cx="143" cy="91" r="4" fill="#f59e0b" opacity="0.35" />
      <circle cx="143" cy="91" r="2" fill="#f59e0b" opacity="0.7" />
      <circle cx="55" cy="94" r="6" stroke="#f59e0b" strokeWidth="1.5" opacity="0.2" />
      <circle cx="55" cy="94" r="3" fill="#f59e0b" opacity="0.35" />
      <circle cx="55" cy="94" r="1.5" fill="#f59e0b" opacity="0.65" />

      {/* Decorative corner dots */}
      <circle cx="20" cy="20" r="4" fill="#0d9488" opacity="0.08" />
      <circle cx="180" cy="130" r="5" fill="#0d9488" opacity="0.07" />
      <circle cx="176" cy="18" r="3" fill="#0d9488" opacity="0.07" />
      <circle cx="22" cy="134" r="4" fill="#0d9488" opacity="0.07" />
    </svg>
  )
}

/* ─── Neck Pain ─────────────────────────────────────────────────────────── */
export function NeckPainIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Neck pain illustration">
      <defs>
        <linearGradient id="np-bg" x1="0" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eff6ff" />
          <stop offset="1" stopColor="#dbeafe" />
        </linearGradient>
        <radialGradient id="np-pain" cx="100" cy="90" r="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="np-center" cx="100" cy="70" r="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="150" fill="url(#np-bg)" />
      <rect width="200" height="150" fill="url(#np-center)" />

      {/* Decorative rings */}
      <circle cx="100" cy="70" r="56" stroke="#3b82f6" strokeWidth="0.5" opacity="0.1" />
      <circle cx="100" cy="70" r="42" stroke="#3b82f6" strokeWidth="0.5" opacity="0.1" />

      {/* Pain aura */}
      <ellipse cx="100" cy="90" rx="38" ry="24" fill="url(#np-pain)" />

      {/* Head silhouette */}
      <ellipse cx="100" cy="32" rx="28" ry="26" fill="#3b82f6" opacity="0.1" />
      <ellipse cx="100" cy="32" rx="28" ry="26" stroke="#3b82f6" strokeWidth="2" opacity="0.35" />

      {/* Neck left line (throat side) */}
      <path d="M82 55 C80 70 79 90 78 115" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      {/* Neck right line (back) */}
      <path d="M118 55 C120 70 121 90 122 115" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Shoulder line */}
      <path d="M40 118 Q65 114 100 116 Q135 114 160 118" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />

      {/* Cervical vertebrae C1–C7 */}
      <rect x="88" y="57" width="24" height="6" rx="2" fill="#3b82f6" opacity="0.5" />
      <rect x="88" y="66" width="24" height="6" rx="2" fill="#3b82f6" opacity="0.55" />
      {/* Pain zone C4–C6 */}
      <rect x="87" y="75" width="26" height="6.5" rx="2" fill="#f97316" opacity="0.8" />
      <rect x="87" y="84.5" width="26" height="6.5" rx="2" fill="#f97316" opacity="0.88" />
      <rect x="87" y="94" width="26" height="6.5" rx="2" fill="#f97316" opacity="0.75" />
      <rect x="88" y="103.5" width="24" height="6" rx="2" fill="#3b82f6" opacity="0.5" />
      <rect x="88" y="112.5" width="24" height="6" rx="2" fill="#3b82f6" opacity="0.45" />

      {/* Connector lines */}
      <line x1="100" y1="63" x2="100" y2="66" stroke="#3b82f6" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="72" x2="100" y2="75" stroke="#3b82f6" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="81.5" x2="100" y2="84.5" stroke="#f97316" strokeWidth="1.5" opacity="0.45" />
      <line x1="100" y1="91" x2="100" y2="94" stroke="#f97316" strokeWidth="1.5" opacity="0.45" />
      <line x1="100" y1="100.5" x2="100" y2="103.5" stroke="#3b82f6" strokeWidth="1.5" opacity="0.35" />
      <line x1="100" y1="109.5" x2="100" y2="112.5" stroke="#3b82f6" strokeWidth="1.5" opacity="0.35" />

      {/* Spinous processes (pointing back) */}
      <line x1="112" y1="60" x2="124" y2="57" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <line x1="112" y1="69" x2="124" y2="66" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <line x1="113" y1="78" x2="126" y2="74" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="113" y1="87.5" x2="128" y2="83.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="113" y1="97" x2="126" y2="93" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="112" y1="106.5" x2="124" y2="103.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />

      {/* Pain pulse */}
      <circle cx="148" cy="87" r="7" stroke="#f97316" strokeWidth="1.5" opacity="0.22" />
      <circle cx="148" cy="87" r="4" fill="#f97316" opacity="0.32" />
      <circle cx="148" cy="87" r="2" fill="#f97316" opacity="0.7" />

      {/* Decorative dots */}
      <circle cx="22" cy="22" r="4" fill="#3b82f6" opacity="0.08" />
      <circle cx="178" cy="130" r="5" fill="#3b82f6" opacity="0.07" />
      <circle cx="175" cy="20" r="3" fill="#3b82f6" opacity="0.07" />
    </svg>
  )
}

/* ─── Knee Pain ─────────────────────────────────────────────────────────── */
export function KneePainIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Knee pain illustration">
      <defs>
        <linearGradient id="kp-bg" x1="0" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5f3ff" />
          <stop offset="1" stopColor="#ede9fe" />
        </linearGradient>
        <radialGradient id="kp-pain" cx="100" cy="76" r="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f43f5e" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f43f5e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="kp-center" cx="100" cy="75" r="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="150" fill="url(#kp-bg)" />
      <rect width="200" height="150" fill="url(#kp-center)" />

      {/* Decorative rings */}
      <circle cx="100" cy="75" r="55" stroke="#7c3aed" strokeWidth="0.5" opacity="0.1" />
      <circle cx="100" cy="75" r="40" stroke="#7c3aed" strokeWidth="0.5" opacity="0.1" />

      {/* Pain aura at knee joint */}
      <ellipse cx="100" cy="76" rx="40" ry="30" fill="url(#kp-pain)" />

      {/* Femur shaft (upper leg) */}
      <rect x="87" y="10" width="26" height="42" rx="13" fill="#7c3aed" opacity="0.18" />
      <rect x="87" y="10" width="26" height="42" rx="13" stroke="#7c3aed" strokeWidth="1.8" opacity="0.5" />

      {/* Femoral condyles (widened bottom of femur) */}
      <ellipse cx="91" cy="58" rx="11" ry="8" fill="#7c3aed" opacity="0.22" stroke="#7c3aed" strokeWidth="1.8" opacity2="0.55" />
      <ellipse cx="109" cy="58" rx="11" ry="8" fill="#7c3aed" opacity="0.22" stroke="#7c3aed" strokeWidth="1.8" />
      <ellipse cx="91" cy="58" rx="11" ry="8" stroke="#7c3aed" strokeWidth="1.8" opacity="0.55" />
      <ellipse cx="109" cy="58" rx="11" ry="8" stroke="#7c3aed" strokeWidth="1.8" opacity="0.55" />

      {/* Patella (kneecap) */}
      <ellipse cx="100" cy="72" rx="14" ry="11" fill="#f43f5e" opacity="0.18" />
      <ellipse cx="100" cy="72" rx="14" ry="11" stroke="#f43f5e" strokeWidth="2.2" opacity="0.75" />
      {/* Patella highlight */}
      <ellipse cx="96" cy="69" rx="4" ry="3" fill="#ffffff" opacity="0.45" />

      {/* Cartilage / joint space */}
      <path d="M80 82 Q100 78 120 82" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" strokeDasharray="3 2" />

      {/* Tibial plateau */}
      <rect x="82" y="84" width="36" height="6" rx="3" fill="#7c3aed" opacity="0.2" stroke="#7c3aed" strokeWidth="1.8" opacity2="0.5" />
      <rect x="82" y="84" width="36" height="6" rx="3" stroke="#7c3aed" strokeWidth="1.8" opacity="0.5" />

      {/* Tibia shaft (lower leg) */}
      <rect x="88" y="90" width="24" height="50" rx="12" fill="#7c3aed" opacity="0.15" />
      <rect x="88" y="90" width="24" height="50" rx="12" stroke="#7c3aed" strokeWidth="1.8" opacity="0.45" />

      {/* Pain pulse indicators */}
      <circle cx="143" cy="72" r="8" stroke="#f43f5e" strokeWidth="1.5" opacity="0.22" />
      <circle cx="143" cy="72" r="4.5" fill="#f43f5e" opacity="0.3" />
      <circle cx="143" cy="72" r="2" fill="#f43f5e" opacity="0.75" />
      <circle cx="57" cy="74" r="6" stroke="#f43f5e" strokeWidth="1.5" opacity="0.2" />
      <circle cx="57" cy="74" r="3" fill="#f43f5e" opacity="0.35" />
      <circle cx="57" cy="74" r="1.5" fill="#f43f5e" opacity="0.7" />

      {/* Decorative dots */}
      <circle cx="22" cy="22" r="4" fill="#7c3aed" opacity="0.08" />
      <circle cx="178" cy="130" r="5" fill="#7c3aed" opacity="0.07" />
      <circle cx="176" cy="20" r="3" fill="#7c3aed" opacity="0.07" />
      <circle cx="24" cy="134" r="4" fill="#7c3aed" opacity="0.07" />
    </svg>
  )
}

/* ─── Post Surgery Rehab ────────────────────────────────────────────────── */
export function RehabIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Post surgery rehabilitation illustration">
      <defs>
        <linearGradient id="rh-bg" x1="0" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecfdf5" />
          <stop offset="1" stopColor="#d1fae5" />
        </linearGradient>
        <radialGradient id="rh-glow" cx="100" cy="75" r="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rh-cross-glow" cx="148" cy="32" r="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" stopOpacity="0.3" />
          <stop offset="1" stopColor="#059669" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="150" fill="url(#rh-bg)" />
      <rect width="200" height="150" fill="url(#rh-glow)" />

      {/* Decorative rings */}
      <circle cx="100" cy="75" r="56" stroke="#059669" strokeWidth="0.5" opacity="0.1" />
      <circle cx="100" cy="75" r="40" stroke="#059669" strokeWidth="0.5" opacity="0.1" />

      {/* Medical cross badge (top right) */}
      <circle cx="148" cy="30" r="22" fill="url(#rh-cross-glow)" />
      <circle cx="148" cy="30" r="18" fill="#059669" opacity="0.12" stroke="#059669" strokeWidth="1.5" opacity2="0.5" />
      <circle cx="148" cy="30" r="18" stroke="#059669" strokeWidth="1.5" opacity="0.5" />
      {/* Cross arms */}
      <rect x="144" y="22" width="8" height="16" rx="2.5" fill="#059669" opacity="0.75" />
      <rect x="140" y="26" width="16" height="8" rx="2.5" fill="#059669" opacity="0.75" />

      {/* Person figure */}
      {/* Head */}
      <circle cx="85" cy="28" r="14" fill="#059669" opacity="0.15" stroke="#059669" strokeWidth="2" opacity2="0.55" />
      <circle cx="85" cy="28" r="14" stroke="#059669" strokeWidth="2" opacity="0.55" />

      {/* Body / spine */}
      <line x1="85" y1="42" x2="85" y2="100" stroke="#059669" strokeWidth="3" strokeLinecap="round" opacity="0.55" />

      {/* Raised arm (left, up — celebrating recovery) */}
      <path d="M85 55 C72 48 60 38 52 28" stroke="#059669" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      {/* Hand */}
      <circle cx="50" cy="26" r="4" fill="#059669" opacity="0.5" />

      {/* Other arm (slightly down/out) */}
      <path d="M85 60 C98 58 110 62 116 68" stroke="#059669" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
      <circle cx="118" cy="70" r="4" fill="#059669" opacity="0.4" />

      {/* Legs */}
      {/* Left leg (stepping forward) */}
      <path d="M85 100 C78 115 72 128 68 140" stroke="#059669" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      {/* Right leg (behind) */}
      <path d="M85 100 C92 114 96 128 100 140" stroke="#059669" strokeWidth="3" strokeLinecap="round" opacity="0.4" />

      {/* Foot left */}
      <path d="M66 140 Q64 142 60 142" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      {/* Foot right */}
      <path d="M100 140 Q102 142 106 142" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />

      {/* Progress arrows (floating, indicating recovery) */}
      <g opacity="0.7">
        <path d="M145 65 L145 53" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        <path d="M141 58 L145 53 L149 58" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g opacity="0.5">
        <path d="M155 72 L155 62" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        <path d="M151 67 L155 62 L159 67" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g opacity="0.35">
        <path d="M165 78 L165 70" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        <path d="M161 74 L165 70 L169 74" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Healing sparkles */}
      <circle cx="130" cy="90" r="3" fill="#059669" opacity="0.35" />
      <circle cx="40" cy="100" r="2.5" fill="#059669" opacity="0.3" />
      <circle cx="170" cy="110" r="2" fill="#059669" opacity="0.25" />

      {/* Decorative dots */}
      <circle cx="22" cy="20" r="4" fill="#059669" opacity="0.08" />
      <circle cx="178" cy="132" r="5" fill="#059669" opacity="0.07" />
      <circle cx="25" cy="135" r="4" fill="#059669" opacity="0.07" />
    </svg>
  )
}

/* ─── Stroke / Paralysis ────────────────────────────────────────────────── */
export function StrokeIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Stroke and paralysis illustration">
      <defs>
        <linearGradient id="st-bg" x1="0" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff1f2" />
          <stop offset="1" stopColor="#ffe4e6" />
        </linearGradient>
        <radialGradient id="st-glow" cx="100" cy="72" r="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="st-bolt" cx="118" cy="72" r="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="150" fill="url(#st-bg)" />
      <rect width="200" height="150" fill="url(#st-glow)" />

      {/* Decorative rings */}
      <circle cx="100" cy="72" r="55" stroke="#e11d48" strokeWidth="0.5" opacity="0.1" />
      <circle cx="100" cy="72" r="40" stroke="#e11d48" strokeWidth="0.5" opacity="0.1" />

      {/* Lightning bolt aura (right lobe disruption) */}
      <ellipse cx="118" cy="72" rx="32" ry="28" fill="url(#st-bolt)" />

      {/* ── Brain outline (top-down/front view, 2 lobes) ── */}
      {/* Left lobe */}
      <path
        d="M100 30 C85 28 68 32 60 44 C52 56 52 68 56 78 C60 88 68 96 78 100 C84 102 92 104 100 103"
        stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"
      />
      {/* Right lobe */}
      <path
        d="M100 30 C115 28 132 32 140 44 C148 56 148 68 144 78 C140 88 132 96 122 100 C116 102 108 104 100 103"
        stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"
      />
      {/* Brain stem */}
      <path d="M95 103 Q100 112 105 103" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* Interhemispheric fissure (center split line) */}
      <line x1="100" y1="30" x2="100" y2="103" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.25" />

      {/* Left lobe gyri (normal, regular curves) */}
      <path d="M70 48 Q76 44 82 48 Q78 54 70 52" stroke="#e11d48" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <path d="M62 62 Q70 58 78 62 Q74 70 62 68" stroke="#e11d48" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <path d="M66 78 Q74 74 82 78 Q78 86 66 84" stroke="#e11d48" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <path d="M78 90 Q86 86 92 90 Q90 96 80 96" stroke="#e11d48" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />

      {/* Right lobe gyri (disrupted/irregular) */}
      <path d="M118 42 Q124 38 130 44" stroke="#e11d48" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M136 60 Q130 56 124 62" stroke="#e11d48" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M134 76 Q128 72 122 78" stroke="#e11d48" strokeWidth="1.2" opacity="0.3" strokeLinecap="round" strokeDasharray="2 2" />

      {/* Lightning bolt (disruption symbol) */}
      <path
        d="M124 42 L116 68 L122 68 L114 92 L130 62 L122 62 Z"
        fill="#f59e0b" opacity="0.85"
        stroke="#f59e0b" strokeWidth="0.5" strokeLinejoin="round"
      />

      {/* Neural disruption dots */}
      <circle cx="142" cy="48" r="2.5" fill="#f59e0b" opacity="0.6" />
      <circle cx="148" cy="62" r="2" fill="#f59e0b" opacity="0.5" />
      <circle cx="145" cy="76" r="2.5" fill="#f59e0b" opacity="0.55" />
      <circle cx="136" cy="88" r="2" fill="#f59e0b" opacity="0.45" />

      {/* Neural connection dots (left lobe — active) */}
      <circle cx="65" cy="55" r="2" fill="#e11d48" opacity="0.35" />
      <circle cx="72" cy="72" r="2" fill="#e11d48" opacity="0.3" />
      <circle cx="80" cy="85" r="2" fill="#e11d48" opacity="0.3" />

      {/* Decorative dots */}
      <circle cx="22" cy="22" r="4" fill="#e11d48" opacity="0.08" />
      <circle cx="178" cy="130" r="5" fill="#e11d48" opacity="0.07" />
      <circle cx="175" cy="20" r="3" fill="#e11d48" opacity="0.07" />
      <circle cx="24" cy="132" r="4" fill="#e11d48" opacity="0.07" />
    </svg>
  )
}

/* ─── Other Condition (Stethoscope) ─────────────────────────────────────── */
export function OtherConditionIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="Other medical condition illustration">
      <defs>
        <linearGradient id="oc-bg" x1="0" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffbeb" />
          <stop offset="1" stopColor="#fef3c7" />
        </linearGradient>
        <radialGradient id="oc-glow" cx="100" cy="75" r="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="150" fill="url(#oc-bg)" />
      <rect width="200" height="150" fill="url(#oc-glow)" />

      {/* Decorative rings */}
      <circle cx="100" cy="75" r="56" stroke="#d97706" strokeWidth="0.5" opacity="0.1" />
      <circle cx="100" cy="75" r="40" stroke="#d97706" strokeWidth="0.5" opacity="0.1" />

      {/* Stethoscope */}

      {/* Chest piece (diaphragm) */}
      <circle cx="100" cy="118" r="18" fill="#d97706" opacity="0.15" />
      <circle cx="100" cy="118" r="18" stroke="#d97706" strokeWidth="2.5" opacity="0.75" />
      {/* Inner rim */}
      <circle cx="100" cy="118" r="11" stroke="#d97706" strokeWidth="1.5" opacity="0.45" />
      {/* Center dot */}
      <circle cx="100" cy="118" r="4" fill="#d97706" opacity="0.6" />
      {/* Highlight */}
      <ellipse cx="95" cy="113" rx="4" ry="3" fill="#ffffff" opacity="0.45" />

      {/* Tubing from chest piece up */}
      <path
        d="M100 100 C100 88 100 80 100 72"
        stroke="#d97706" strokeWidth="5" strokeLinecap="round" opacity="0.5"
      />
      <path
        d="M100 100 C100 88 100 80 100 72"
        stroke="#d97706" strokeWidth="3" strokeLinecap="round" opacity="0.75"
      />

      {/* Tubing curves to the two earpieces */}
      {/* Left curve */}
      <path
        d="M100 72 C92 66 78 60 65 52"
        stroke="#d97706" strokeWidth="5" strokeLinecap="round" opacity="0.5"
      />
      <path
        d="M100 72 C92 66 78 60 65 52"
        stroke="#d97706" strokeWidth="3" strokeLinecap="round" opacity="0.75"
      />
      {/* Right curve */}
      <path
        d="M100 72 C108 66 122 60 135 52"
        stroke="#d97706" strokeWidth="5" strokeLinecap="round" opacity="0.5"
      />
      <path
        d="M100 72 C108 66 122 60 135 52"
        stroke="#d97706" strokeWidth="3" strokeLinecap="round" opacity="0.75"
      />

      {/* Left earpiece */}
      <circle cx="63" cy="50" r="7" fill="#d97706" opacity="0.2" stroke="#d97706" strokeWidth="2" opacity2="0.7" />
      <circle cx="63" cy="50" r="7" stroke="#d97706" strokeWidth="2" opacity="0.7" />
      <line x1="60" y1="44" x2="63" y2="40" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* Right earpiece */}
      <circle cx="137" cy="50" r="7" fill="#d97706" opacity="0.2" stroke="#d97706" strokeWidth="2" opacity2="0.7" />
      <circle cx="137" cy="50" r="7" stroke="#d97706" strokeWidth="2" opacity="0.7" />
      <line x1="140" y1="44" x2="137" y2="40" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* Heartbeat / ECG line beneath chest piece */}
      <path
        d="M40 136 L58 136 L65 124 L72 148 L80 130 L88 136 L160 136"
        stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"
      />

      {/* Sparkle / question dots */}
      <circle cx="32" cy="80" r="3.5" fill="#d97706" opacity="0.3" />
      <circle cx="168" cy="88" r="3" fill="#d97706" opacity="0.28" />
      <circle cx="160" cy="120" r="2.5" fill="#d97706" opacity="0.22" />
      <circle cx="38" cy="115" r="2" fill="#d97706" opacity="0.22" />

      {/* Decorative corner dots */}
      <circle cx="22" cy="22" r="4" fill="#d97706" opacity="0.08" />
      <circle cx="178" cy="130" r="5" fill="#d97706" opacity="0.07" />
      <circle cx="175" cy="20" r="3" fill="#d97706" opacity="0.07" />
      <circle cx="24" cy="132" r="4" fill="#d97706" opacity="0.07" />
    </svg>
  )
}
