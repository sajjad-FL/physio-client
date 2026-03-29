import { useEffect, useMemo, useRef, useState } from 'react'

function toYMD(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYMDLocal(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function buildMonthGrid(viewYear, viewMonthIndex) {
  const first = new Date(viewYear, viewMonthIndex, 1)
  const lead = first.getDay()
  const gridStart = new Date(viewYear, viewMonthIndex, 1 - lead)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push(d)
  }
  return cells
}

const WEEKDAY = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/**
 * Multi-select calendar: click or click-drag to select/deselect (brush).
 * Uses mouseDown / mouseEnter while dragging / window mouseUp.
 *
 * @param {object} props
 * @param {Date[]} props.selectedDates
 * @param {(updater: Date[] | ((prev: Date[]) => Date[])) => void} props.onDatesChange — supports React setState functional updates
 * @param {Date} props.minDate
 * @param {number} props.maxSelectable — cap when mode is "add" (e.g. session count)
 */
export default function DragSelectCalendar({ selectedDates, onDatesChange, minDate, maxSelectable }) {
  const min = startOfDay(minDate)
  const minMonthStart = useMemo(
    () => new Date(min.getFullYear(), min.getMonth(), 1).getTime(),
    [min.getTime()],
  )
  const dragRef = useRef({ active: false, mode: 'add', lastKey: /** @type {string | null} */ (null) })

  const [view, setView] = useState(() => new Date(min.getFullYear(), min.getMonth(), 1))

  useEffect(() => {
    const vm = new Date(minMonthStart)
    setView((v) => {
      const vv = new Date(v.getFullYear(), v.getMonth(), 1)
      return vv < vm ? vm : v
    })
  }, [minMonthStart])

  const viewYear = view.getFullYear()
  const viewMonth = view.getMonth()
  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const selectedKeys = useMemo(() => new Set(selectedDates.map((d) => toYMD(d))), [selectedDates])

  useEffect(() => {
    function endDrag() {
      dragRef.current = { active: false, mode: 'add', lastKey: null }
    }
    window.addEventListener('mouseup', endDrag)
    window.addEventListener('blur', endDrag)
    return () => {
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('blur', endDrag)
    }
  }, [])

  function patchDates(update) {
    onDatesChange((prev) => update(prev))
  }

  function handleDayMouseDown(e, date) {
    e.preventDefault()
    const ymd = toYMD(date)
    if (startOfDay(date) < min) return

    const isSel = selectedKeys.has(ymd)
    const mode = isSel ? 'remove' : 'add'
    dragRef.current = { active: true, mode, lastKey: ymd }

    patchDates((prev) => {
      const keys = new Set(prev.map((d) => toYMD(d)))
      if (mode === 'add') {
        if (keys.has(ymd)) return prev
        if (keys.size >= maxSelectable) return prev
        const parsed = parseYMDLocal(ymd)
        return parsed ? [...prev, parsed] : prev
      }
      return prev.filter((d) => toYMD(d) !== ymd)
    })
  }

  function handleDayMouseEnter(date) {
    if (!dragRef.current.active) return
    const ymd = toYMD(date)
    if (ymd === dragRef.current.lastKey) return
    if (startOfDay(date) < min) return

    dragRef.current = { ...dragRef.current, lastKey: ymd }
    const mode = dragRef.current.mode

    patchDates((prev) => {
      if (mode === 'add') {
        const keys = new Set(prev.map((d) => toYMD(d)))
        if (keys.has(ymd)) return prev
        if (keys.size >= maxSelectable) return prev
        const parsed = parseYMDLocal(ymd)
        return parsed ? [...prev, parsed] : prev
      }
      return prev.filter((d) => toYMD(d) !== ymd)
    })
  }

  function goPrevMonth() {
    setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))
  }

  function goNextMonth() {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))
  }

  const title = view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="select-none rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-100/80">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrevMonth}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-95"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold capitalize text-gray-900">{title}</p>
        <button
          type="button"
          onClick={goNextMonth}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-95"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {WEEKDAY.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date) => {
          const ymd = toYMD(date)
          const inMonth = date.getMonth() === viewMonth
          const disabled = startOfDay(date) < min
          const selected = selectedKeys.has(ymd)

          let cellCls =
            'flex aspect-square max-h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 '
          if (disabled) {
            cellCls += 'cursor-not-allowed text-gray-300 '
          } else if (selected) {
            cellCls +=
              'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-500/30 hover:bg-blue-700 '
          } else if (inMonth) {
            cellCls +=
              'text-gray-900 hover:bg-blue-50 hover:text-blue-800 hover:shadow-sm active:scale-95 '
          } else {
            cellCls += 'text-gray-300 hover:bg-gray-50 '
          }

          return (
            <button
              key={ymd + viewMonth}
              type="button"
              disabled={disabled}
              className={cellCls}
              onMouseDown={(e) => handleDayMouseDown(e, date)}
              onMouseEnter={() => handleDayMouseEnter(date)}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Click or drag across days to select. Drag from a selected day to deselect.
      </p>
    </div>
  )
}
