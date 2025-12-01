import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: any;
  trend?: string;
}

export const KPICard = ({ title, value, change, changeLabel, icon, trend }: KPICardProps) => {
  const isPositive = change ? change > 0 : trend?.startsWith('+') || false;
  const isNeutral = change === 0 || trend === '0';
  
  return (
    <Card className="glass-card hover:shadow-glow transition-all duration-500 hover:scale-[1.02] border-border/30 group animate-fly-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className="text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              {React.createElement(icon, { className: "h-5 w-5" })}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold text-foreground bg-gradient-primary bg-clip-text group-hover:text-transparent transition-all duration-300">
            {value}
          </p>
          {(change !== undefined || trend) && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-all duration-300",
                  isPositive && "text-success group-hover:scale-105",
                  !isPositive && !isNeutral && "text-destructive group-hover:scale-105",
                  isNeutral && "text-muted-foreground"
                )}
              >
                {isPositive && <TrendingUp className="w-4 h-4 animate-pulse" />}
                {!isPositive && !isNeutral && <TrendingDown className="w-4 h-4 animate-pulse" />}
                {isNeutral && <Minus className="w-4 h-4" />}
                <span>{trend || `${Math.abs(change || 0)}%`}</span>
              </div>
              {changeLabel && <span className="text-sm text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
