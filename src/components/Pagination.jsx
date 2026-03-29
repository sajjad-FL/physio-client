export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let p = start; p <= end; p += 1) pages.push(p)

  const base =
    'cursor-pointer rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition duration-200 ease-in-out'

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={`${base} border border-border-subtle bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Previous
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={
            p === page
              ? `${base} bg-blue-500 text-white hover:bg-blue-600`
              : `${base} bg-gray-200 text-ink hover:bg-gray-300`
          }
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={`${base} border border-border-subtle bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Next
      </button>
    </div>
  )
}
