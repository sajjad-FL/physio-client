/**
 * Condition-specific SVG illustrations for homepage "What we help with".
 *
 * Each illustration is a simple, recognisable body-part drawing with a red
 * "pain" indicator (or relevant motif) so patients can scan the cards
 * visually and instantly know which card is about which condition.
 *
 * viewBox is a square 120x120 so they render cleanly in any ratio.
 * All colours pull from the teal/slate brand so no external assets are needed.
 */

const PAIN_GRADIENT = (
  <defs>
    <radialGradient id="pain-burst" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#fb7185" stopOpacity="0.95" />
      <stop offset="60%" stopColor="#ef4444" stopOpacity="0.5" />
      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ecfeff" />
      <stop offset="100%" stopColor="#ccfbf1" />
    </linearGradient>
  </defs>
)

const BG = <rect x="0" y="0" width="120" height="120" rx="16" fill="url(#card-bg)" />

/* Back Pain — full standing figure (rear view) with pain on lower back */
function BackPainSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      {PAIN_GRADIENT}
      {BG}
      {/* Hair / head back */}
      <path
        d="M49 14 Q60 8 71 14 Q75 22 73 30 Q71 34 67 35 L53 35 Q49 34 47 30 Q45 22 49 14 Z"
        fill="#1e293b"
      />
      {/* Head */}
      <ellipse cx="60" cy="24" rx="11" ry="12" fill="#1f2937" />
      {/* Hairline shadow at nape */}
      <path d="M50 30 Q60 34 70 30 Q70 36 60 36 Q50 36 50 30 Z" fill="#0f172a" />
      {/* Neck */}
      <path d="M55 34 Q55 40 60 40 Q65 40 65 34 L65 36 L55 36 Z" fill="#0f766e" />
      {/* Torso (rear silhouette: broad shoulders, narrowing waist, slight hip) */}
      <path
        d="M30 50 
           Q30 42 38 41 
           Q48 38 60 38 
           Q72 38 82 41 
           Q90 42 90 50 
           L86 60 
           Q84 64 82 62 
           L82 92 
           Q82 100 76 102 
           L44 102 
           Q38 100 38 92 
           L38 62 
           Q36 64 34 60 
           Z"
        fill="#134e4a"
      />
      {/* Left arm */}
      <path d="M30 50 Q26 70 28 90 Q29 96 35 96 Q40 96 40 90 L40 56 Z" fill="#134e4a" />
      {/* Right arm */}
      <path d="M90 50 Q94 70 92 90 Q91 96 85 96 Q80 96 80 90 L80 56 Z" fill="#134e4a" />
      {/* Subtle shoulder-blade contour */}
      <path d="M50 50 Q52 58 50 66" stroke="#0f766e" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M70 50 Q68 58 70 66" stroke="#0f766e" strokeWidth="1.2" fill="none" opacity="0.7" />
      {/* Spine groove */}
      <path d="M60 42 L60 96" stroke="#0b3d3a" strokeWidth="2" opacity="0.85" />
      {/* Vertebrae markers */}
      {[46, 52, 58, 64, 70, 76, 82, 88].map((y) => (
        <circle key={y} cx="60" cy={y} r="1.6" fill="#e2e8f0" opacity="0.9" />
      ))}
      {/* Pain glow on lower back */}
      <circle cx="60" cy="82" r="18" fill="url(#pain-burst)" />
      <circle cx="60" cy="82" r="4.5" fill="#ef4444" />
      <text x="60" y="86" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Inter,sans-serif">!</text>
    </svg>
  )
}

/* Neck Pain — head + shoulders with cervical pain area highlighted */
function NeckPainSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      {PAIN_GRADIENT}
      {BG}
      {/* Hair (slightly tilted head) */}
      <path
        d="M44 22 Q60 12 76 22 Q80 30 78 40 Q76 46 70 46 L50 46 Q44 46 42 40 Q40 30 44 22 Z"
        fill="#1e293b"
      />
      {/* Head — front-ish view */}
      <ellipse cx="60" cy="34" rx="14" ry="16" fill="#f5d0a9" />
      {/* Hair on top */}
      <path d="M44 28 Q60 14 76 28 Q72 22 60 20 Q48 22 44 28 Z" fill="#0f172a" />
      {/* Brow line */}
      <path d="M52 32 Q56 30 60 32" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M60 32 Q64 30 68 32" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="55" cy="36" r="1.4" fill="#0f172a" />
      <circle cx="65" cy="36" r="1.4" fill="#0f172a" />
      {/* Mouth (slight grimace) */}
      <path d="M55 44 Q60 42 65 44" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <path d="M53 48 L53 62 Q53 66 58 66 L62 66 Q67 66 67 62 L67 48 Z" fill="#f5d0a9" />
      {/* Shoulders / upper torso */}
      <path
        d="M14 110 
           L14 86 
           Q14 74 30 70 
           L48 66 
           Q60 64 72 66 
           L90 70 
           Q106 74 106 86 
           L106 110 Z"
        fill="#134e4a"
      />
      {/* Collarbone hint */}
      <path d="M40 70 Q60 76 80 70" stroke="#0f766e" strokeWidth="1.2" fill="none" opacity="0.8" />
      {/* Cervical vertebrae markers (down the back of neck) */}
      {[52, 58, 64].map((y) => (
        <circle key={y} cx="60" cy={y} r="1.4" fill="#0f172a" opacity="0.4" />
      ))}
      {/* Pain glow on neck */}
      <circle cx="60" cy="58" r="17" fill="url(#pain-burst)" />
      <circle cx="60" cy="58" r="4.5" fill="#ef4444" />
      <text x="60" y="62" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Inter,sans-serif">!</text>
      {/* Pain radiation lines */}
      <path d="M44 50 L40 46 M76 50 L80 46 M44 66 L40 70 M76 66 L80 70" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

/* Knee Pain — anatomical leg in profile with patella and pain on knee */
function KneePainSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      {PAIN_GRADIENT}
      {BG}
      {/* Thigh (quadriceps shape — wider at hip, narrowing toward knee) */}
      <path
        d="M44 8 
           Q44 6 50 6 
           L74 6 
           Q78 6 78 10 
           L74 56 
           Q72 60 66 60 
           L52 60 
           Q47 60 46 56 Z"
        fill="#134e4a"
      />
      {/* Quadriceps contour */}
      <path d="M58 10 Q60 32 58 56" stroke="#0f766e" strokeWidth="1.2" fill="none" opacity="0.7" />
      {/* Knee joint capsule */}
      <path
        d="M46 58 
           Q46 56 52 56 
           L70 56 
           Q74 56 74 60 
           L74 70 
           Q74 74 70 74 
           L52 74 
           Q46 74 46 70 Z"
        fill="#0f766e"
      />
      {/* Patella (kneecap) */}
      <ellipse cx="60" cy="65" rx="8" ry="6.5" fill="#f1f5f9" stroke="#0f172a" strokeWidth="0.8" />
      <ellipse cx="60" cy="65" rx="3.5" ry="2.8" fill="#cbd5e1" />
      {/* Joint line above and below patella */}
      <path d="M48 60 L72 60" stroke="#0f172a" strokeWidth="0.6" opacity="0.5" />
      <path d="M48 72 L72 72" stroke="#0f172a" strokeWidth="0.6" opacity="0.5" />
      {/* Shin (tibia) */}
      <path
        d="M48 74 
           Q48 72 54 72 
           L68 72 
           Q72 72 72 76 
           L70 102 
           Q70 106 64 106 
           L56 106 
           Q50 106 50 102 Z"
        fill="#134e4a"
      />
      {/* Tibial ridge (front of shin) */}
      <path d="M60 76 L60 104" stroke="#0f766e" strokeWidth="1.2" fill="none" opacity="0.7" />
      {/* Foot */}
      <path d="M50 106 L50 110 Q50 114 56 114 L84 114 Q88 114 88 110 L86 106 Z" fill="#0f172a" />
      {/* Pain glow on knee */}
      <circle cx="60" cy="65" r="22" fill="url(#pain-burst)" />
      <circle cx="60" cy="65" r="4.5" fill="#ef4444" />
      <text x="60" y="69" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Inter,sans-serif">!</text>
      {/* Pain radiation lines */}
      <path d="M40 58 L34 54 M80 58 L86 54 M40 72 L34 76 M80 72 L86 76" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

/* Post Surgery Rehab — crutch + bandage cross */
function PostSurgerySvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      {PAIN_GRADIENT}
      {BG}
      {/* Crutch armrest */}
      <rect x="24" y="18" width="28" height="6" rx="3" fill="#134e4a" />
      {/* Crutch grip */}
      <rect x="34" y="38" width="8" height="6" rx="2" fill="#134e4a" />
      {/* Crutch shaft */}
      <path d="M38 24 L38 38 M38 44 L32 100" stroke="#134e4a" strokeWidth="5" strokeLinecap="round" />
      {/* Crutch base */}
      <circle cx="32" cy="102" r="4" fill="#0f172a" />
      {/* Bandage wrap on leg (right side) */}
      <rect x="72" y="40" width="28" height="54" rx="8" fill="#fff" stroke="#0f766e" strokeWidth="2" />
      {/* Bandage strips */}
      <path d="M72 56 L100 52 M72 72 L100 68 M72 88 L100 84" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" />
      {/* Medical plus */}
      <circle cx="86" cy="30" r="10" fill="#0f766e" />
      <path d="M86 24 L86 36 M80 30 L92 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* Stroke / Paralysis — brain with highlighted hemisphere */
function StrokeSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      {PAIN_GRADIENT}
      {BG}
      {/* Brain outline */}
      <path
        d="M38 50 C32 48 26 52 26 60 C26 68 32 72 36 72 C34 78 38 86 46 88 C48 94 58 98 62 94 C66 98 76 94 78 88 C86 86 90 78 88 72 C92 72 98 68 98 60 C98 52 92 48 86 50 C88 42 82 34 74 36 C72 30 62 28 60 32 C58 28 48 30 46 36 C38 34 32 42 38 50 Z"
        fill="#134e4a"
      />
      {/* Brain fissures */}
      <path d="M60 32 L60 94" stroke="#e2e8f0" strokeWidth="2" fill="none" />
      <path d="M40 58 C48 54 54 58 58 62" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
      <path d="M80 58 C72 54 66 58 62 62" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
      <path d="M42 74 C50 70 54 74 58 78" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
      <path d="M78 74 C70 70 66 74 62 78" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
      {/* Affected (right) hemisphere highlight */}
      <path
        d="M60 32 C70 30 78 34 82 42 C90 44 94 54 92 62 C94 72 88 82 80 86 C74 94 64 94 60 90 Z"
        fill="url(#pain-burst)"
      />
    </svg>
  )
}

/* Cerebral Palsy — child with walker / motor support */
function CerebralPalsySvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      {PAIN_GRADIENT}
      {BG}
      {/* Head */}
      <circle cx="46" cy="32" r="9" fill="#0f172a" />
      {/* Body */}
      <path d="M38 42 L54 42 L56 78 L36 78 Z" fill="#134e4a" />
      {/* Arm reaching walker */}
      <path d="M54 48 L74 58" stroke="#134e4a" strokeWidth="6" strokeLinecap="round" />
      {/* Legs */}
      <path d="M40 78 L36 102" stroke="#134e4a" strokeWidth="6" strokeLinecap="round" />
      <path d="M52 78 L54 102" stroke="#134e4a" strokeWidth="6" strokeLinecap="round" />
      {/* Walker frame */}
      <path d="M74 58 L74 100" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
      <path d="M92 58 L92 100" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
      <path d="M74 58 L92 58" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" />
      <path d="M74 76 L92 76" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
      {/* Wheels */}
      <circle cx="74" cy="103" r="4" fill="#0f172a" />
      <circle cx="92" cy="103" r="4" fill="#0f172a" />
      {/* Heart */}
      <path
        d="M100 30 C104 26 110 28 110 34 C110 40 102 44 100 46 C98 44 90 40 90 34 C90 28 96 26 100 30 Z"
        fill="#f43f5e"
      />
    </svg>
  )
}

/* Other condition — stethoscope with question mark */
function OtherConditionSvg({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      {PAIN_GRADIENT}
      {BG}
      {/* Stethoscope ear tubes */}
      <path
        d="M34 30 L34 56 C34 72 50 82 58 82 C66 82 82 72 82 56 L82 30"
        fill="none"
        stroke="#134e4a"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="34" cy="30" r="4" fill="#0f172a" />
      <circle cx="82" cy="30" r="4" fill="#0f172a" />
      {/* Stethoscope tubing to chestpiece */}
      <path d="M58 82 L58 92" stroke="#134e4a" strokeWidth="5" strokeLinecap="round" />
      {/* Chestpiece */}
      <circle cx="58" cy="98" r="10" fill="#0f766e" stroke="#134e4a" strokeWidth="2.5" />
      <circle cx="58" cy="98" r="4" fill="#e2e8f0" />
      {/* Question mark badge */}
      <circle cx="94" cy="30" r="14" fill="#f59e0b" />
      <text x="94" y="37" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff" fontFamily="Inter,sans-serif">?</text>
    </svg>
  )
}

const MAP = {
  'Back Pain': BackPainSvg,
  'Neck Pain': NeckPainSvg,
  'Knee Pain': KneePainSvg,
  'Post Surgery Rehab': PostSurgerySvg,
  'Stroke/Paralysis': StrokeSvg,
  'Cerebral Palsy': CerebralPalsySvg,
  'Other condition': OtherConditionSvg,
}

export default function ConditionIllustration({ title, className = '' }) {
  const Component = MAP[title] || OtherConditionSvg
  return <Component className={className} />
}
