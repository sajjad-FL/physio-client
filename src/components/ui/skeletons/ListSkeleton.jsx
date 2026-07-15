import Skeleton from '../Skeleton'

/** Booking / appointment row skeletons matching operational list cards. */
export default function ListSkeleton({ count = 5, className = '' }) {
  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm ring-1 ring-gray-100/80"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40 rounded-md" />
            <Skeleton className="h-3 w-56 rounded-md" />
            <Skeleton className="h-2.5 w-28 rounded-md" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
