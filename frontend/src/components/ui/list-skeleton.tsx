import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  className?: string;
}

/**
 * Reusable skeleton loading grid used across list views while data is
 * fetched for the first time.
 */
export function ListSkeleton({ count = 4, className }: ListSkeletonProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/40 p-5 space-y-3"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
