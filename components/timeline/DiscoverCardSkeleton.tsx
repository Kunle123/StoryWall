import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching StorySummaryCard grid layout */
export const DiscoverCardSkeleton = () => {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Skeleton className="h-[5.5rem] w-full rounded-none shrink-0" />
      <div className="p-3.5 flex flex-col flex-1 space-y-2">
        <div className="flex justify-between gap-2">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-12 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-2 pt-2 mt-auto border-t border-border/30">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </Card>
  );
};
