import Skeleton from '../Skeleton'

/** Shop / featured physio card grid skeletons. */
export default function CardGridSkeleton({ count = 6, className = '' }) {
  return (
    <div
      className={['grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className].filter(Boolean).join(' ')}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border-subtle/80 bg-white shadow-sm"
        >
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
