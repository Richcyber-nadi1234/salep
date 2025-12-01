import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export const SkeletonChart = () => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-end justify-between gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full animate-pulse"
              style={{
                height: `${Math.random() * 60 + 40}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
