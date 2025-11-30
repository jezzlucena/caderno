interface FeedSkeletonProps {
  count?: number
}

export function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card bg-base-100 shadow-sm animate-pulse">
          <div className="card-body p-4">
            {/* Author row */}
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar skeleton */}
              <div className="w-10 h-10 rounded-full bg-base-300" />
              {/* Author info skeleton */}
              <div className="flex-1">
                <div className="h-4 bg-base-300 rounded w-32 mb-1" />
                <div className="h-3 bg-base-300 rounded w-24" />
              </div>
              {/* Badge skeleton */}
              <div className="h-5 bg-base-300 rounded w-16" />
            </div>

            {/* Title skeleton */}
            <div className="h-5 bg-base-300 rounded w-3/4 mb-2" />

            {/* Content skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-base-300 rounded w-full" />
              <div className="h-4 bg-base-300 rounded w-5/6" />
              <div className="h-4 bg-base-300 rounded w-4/6" />
            </div>

            {/* Date skeleton */}
            <div className="h-3 bg-base-300 rounded w-20 mt-3" />
          </div>
        </div>
      ))}
    </div>
  )
}
