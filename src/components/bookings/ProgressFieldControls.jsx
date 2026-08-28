import { getPainBgColor, getPainColor, getPainLabel } from '../../utils/painScale'

export function ScalePicker({ label, hint, value, onChange, required }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Array.from({ length: 11 }, (_, i) => {
          const selected = Number(value) === i
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={`h-9 w-9 rounded-lg text-xs font-bold transition ${
                selected
                  ? 'text-white shadow-sm ring-2 ring-offset-1'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-300'
              }`}
              style={
                selected
                  ? { backgroundColor: getPainColor(i), ringColor: getPainColor(i) }
                  : undefined
              }
            >
              {i}
            </button>
          )
        })}
      </div>
      {value != null && Number.isFinite(Number(value)) ? (
        <p className="mt-1.5 text-xs font-medium" style={{ color: getPainColor(Number(value)) }}>
          {getPainLabel(Number(value))}
          <span
            className="ml-2 inline-block rounded px-1.5 py-0.5 text-[10px]"
            style={{ backgroundColor: getPainBgColor(Number(value)) }}
          >
            {value}/10
          </span>
        </p>
      ) : null}
    </div>
  )
}

export function ChipGroup({ label, hint, options, value, onChange, multi, required }) {
  const selected = multi ? (Array.isArray(value) ? value : []) : value

  function toggle(opt) {
    const v = typeof opt === 'object' ? opt.value : opt
    if (multi) {
      const set = new Set(selected)
      if (set.has(v)) set.delete(v)
      else set.add(v)
      // "None" exclusive for precautions
      if (v === 'None') onChange(['None'])
      else onChange([...set].filter((x) => x !== 'None'))
      return
    }
    onChange(selected === v ? null : v)
  }

  function isOn(opt) {
    const v = typeof opt === 'object' ? opt.value : opt
    return multi ? selected.includes(v) : selected === v
  }

  function labelOf(opt) {
    return typeof opt === 'object' ? opt.label : opt
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = isOn(opt)
          return (
            <button
              key={labelOf(opt)}
              type="button"
              onClick={() => toggle(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                on
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-teal-300'
              }`}
            >
              {labelOf(opt)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Compact structured chips for read-only display. */
export function ProgressSnapshot({ data, title = 'Progress' }) {
  if (!data) return null
  const chips = []
  if (data.painNow != null) chips.push(`Pain ${data.painNow}/10`)
  if (data.painOnMovement != null) chips.push(`Move ${data.painOnMovement}/10`)
  if (data.functionNow != null) chips.push(`Function ${data.functionNow}/10`)
  if (data.sleep) chips.push(`Sleep ${data.sleep}`)
  if (data.mobility) chips.push(`Mobility ${data.mobility}`)
  if (data.vsLastVisit) chips.push(`Vs last: ${data.vsLastVisit}`)
  if (data.homeExercises) chips.push(`Exercises ${data.homeExercises}`)
  if (data.painMeds) chips.push(`Meds ${data.painMeds}`)
  if (Array.isArray(data.areas) && data.areas.length) chips.push(data.areas.join(', '))
  if (!chips.length && !data.text?.trim() && !data.extraNotes?.trim()) return null

  return (
    <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">{title}</p>
      {chips.length ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200/80"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
