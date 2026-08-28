import Skeleton from '../Skeleton'

/** Header + body blocks for booking / profile detail pages. */
export default function DetailSkeleton({ className = '' }) {
  return (
    <div className={['space-y-4', className].filter(Boolean).join(' ')} role="status" aria-label="Loading">
      <div className="space-y-3 rounded-2xl border border-border-subtle/80 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-56 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
          <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-border-subtle/80 bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-5/6 rounded-md" />
        <Skeleton className="h-3 w-64 rounded-md" />
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-border-subtle/80 bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-36 rounded-md" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  )
}
