import { Activity, ShieldCheck } from 'lucide-react'

/** Grid / Body Map segmented control — matches landing page styling. */
export default function PainViewModeToggle({ mode, onChange, className = '' }) {
  return (
    <div
      className={`flex shrink-0 rounded-2xl bg-slate-200/60 p-1.5 shadow-inner ${className}`}
      role="tablist"
      aria-label="Booking view mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'grid'}
        onClick={() => onChange('grid')}
        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all cursor-pointer sm:px-5 ${
          mode === 'grid'
            ? 'bg-white text-teal-800 shadow-md'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Activity size={14} className={mode === 'grid' ? 'text-teal-600' : ''} />
        Grid
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'map'}
        onClick={() => onChange('map')}
        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all cursor-pointer sm:px-5 ${
          mode === 'map'
            ? 'bg-white text-teal-800 shadow-md'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <ShieldCheck size={14} className={mode === 'map' ? 'text-teal-600' : ''} />
        Body Map
      </button>
    </div>
  )
}
