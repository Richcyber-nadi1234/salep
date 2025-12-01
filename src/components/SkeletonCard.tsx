import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export const SkeletonCard = () => {
  return (
    <Card className="glass-card animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
