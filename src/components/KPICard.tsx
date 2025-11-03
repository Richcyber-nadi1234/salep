import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon?: React.ReactNode;
}

export const KPICard = ({ title, value, change, changeLabel, icon }: KPICardProps) => {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositive && "text-success",
                !isPositive && !isNeutral && "text-destructive",
                isNeutral && "text-muted-foreground"
              )}
            >
              {isPositive && <TrendingUp className="w-4 h-4" />}
              {!isPositive && !isNeutral && <TrendingDown className="w-4 h-4" />}
              {isNeutral && <Minus className="w-4 h-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
            <span className="text-sm text-muted-foreground">{changeLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
