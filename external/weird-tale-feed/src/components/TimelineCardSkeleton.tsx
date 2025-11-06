import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export const TimelineCardSkeleton = () => {
  return (
    <Card className="p-4 bg-card border-y border-x-0 rounded-none">
      <div className="space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-5 w-3/4" />

        {/* Description skeleton - 3 lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Image skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />

        {/* Action buttons skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-3">
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </Card>
  );
};
