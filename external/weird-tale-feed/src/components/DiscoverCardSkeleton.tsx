import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export const DiscoverCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Image skeleton */}
        <Skeleton className="w-full sm:w-48 h-48 rounded-none" />
        
        {/* Content skeleton */}
        <div className="flex-1 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          
          {/* Description skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          
          {/* Meta info skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
};
