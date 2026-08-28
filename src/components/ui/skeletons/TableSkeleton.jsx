import Skeleton from '../Skeleton'

/** Admin table / dense list row skeletons. */
export default function TableSkeleton({ rows = 6, className = '' }) {
  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')} role="status" aria-label="Loading">
      <div className="mb-3 hidden items-center gap-3 px-2 sm:flex">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-3 w-32 rounded-md" />
        <Skeleton className="ml-auto h-3 w-20 rounded-md" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm ring-1 ring-gray-100/60"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 rounded-md" />
            <Skeleton className="h-2.5 w-48 rounded-md" />
          </div>
          <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
          <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
