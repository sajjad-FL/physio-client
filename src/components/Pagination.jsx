import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZE_OPTIONS } from '../hooks/usePagination'

export { PAGE_SIZE_OPTIONS }

function pageWindow(page, totalPages) {
  const pages = []
  const start = Math.max(1, page - 1)
  const end = Math.min(totalPages, page + 1)
  for (let p = start; p <= end; p += 1) pages.push(p)
  return { start, end, pages }
}

function rangeLabel(page, pageSize, total) {
  const t = Number(total)
  if (!Number.isFinite(t) || t <= 0) return null
  const size = Number(pageSize) || 10
  return {
    from: (page - 1) * size + 1,
    to: Math.min(page * size, t),
    total: t,
  }
}

/** Single shared list pagination control — prefer usePagination().paginationProps */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}) {
  const showPages = Number(totalPages) > 1
  const showPageSize = Boolean(onPageSizeChange && pageSize)
  const showTotalOnly = !showPageSize && Number.isFinite(Number(total)) && Number(total) > 0
  if (!showPages && !showPageSize && !showTotalOnly) return null

  const { start, end, pages } = pageWindow(page, Math.max(1, Number(totalPages) || 1))
  const range = rangeLabel(page, pageSize, total)
  const tp = Math.max(1, Number(totalPages) || 1)

  return (
    <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
      <div className="inline-flex max-w-full flex-wrap items-center justify-end gap-x-2 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {range ? (
          <p className="whitespace-nowrap px-1.5 text-[13px] leading-none text-slate-600">
            <span className="font-semibold tabular-nums text-slate-800">
              {range.from}–{range.to}
            </span>
            <span className="mx-1 text-slate-400">/</span>
            <span className="tabular-nums text-slate-600">{range.total}</span>
          </p>
        ) : Number.isFinite(Number(total)) && Number(total) > 0 ? (
          <p className="whitespace-nowrap px-1.5 text-[13px] leading-none text-slate-600">
            <span className="font-semibold tabular-nums text-slate-800">{Number(total)}</span> total
          </p>
        ) : null}

        {showPageSize ? (
          <>
            <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
            <label className="inline-flex items-center gap-1.5 px-0.5 text-[13px] leading-none text-slate-500">
              <span className="sr-only">Rows per page</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-7 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-[13px] font-medium tabular-nums text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {showPages ? (
          <>
            <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
            <nav className="inline-flex items-center gap-0.5" aria-label="Pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </button>

              {start > 1 ? (
                <>
                  <PageButton active={false} onClick={() => onPageChange(1)}>
                    1
                  </PageButton>
                  {start > 2 ? <Ellipsis /> : null}
                </>
              ) : null}

              {pages.map((p) => (
                <PageButton key={p} active={p === page} onClick={() => onPageChange(p)}>
                  {p}
                </PageButton>
              ))}

              {end < tp ? (
                <>
                  {end < tp - 1 ? <Ellipsis /> : null}
                  <PageButton active={false} onClick={() => onPageChange(tp)}>
                    {tp}
                  </PageButton>
                </>
              ) : null}

              <button
                type="button"
                disabled={page >= tp}
                onClick={() => onPageChange(page + 1)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </button>
            </nav>
          </>
        ) : null}
      </div>
    </div>
  )
}

function PageButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={[
        'inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[13px] font-medium tabular-nums transition-colors',
        active
          ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
          : 'text-slate-600 hover:bg-white hover:text-slate-900',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Ellipsis() {
  return (
    <span className="inline-flex h-7 w-5 items-center justify-center text-[12px] text-slate-400" aria-hidden>
      …
    </span>
  )
}
