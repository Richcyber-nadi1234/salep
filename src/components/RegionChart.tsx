import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface RegionData {
  region: string;
  revenue: number;
}

interface RegionChartProps {
  data: RegionData[];
  onRegionClick: (region: string) => void;
  selectedRegion: string | null;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export const RegionChart = ({ data, onRegionClick, selectedRegion }: RegionChartProps) => {
  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Revenue by Region
          {selectedRegion && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (Click bar to drill down)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="region" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Bar 
              dataKey="revenue" 
              radius={[8, 8, 0, 0]}
              onClick={(data) => onRegionClick(data.region)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={selectedRegion === entry.region ? "hsl(var(--accent))" : COLORS[index % COLORS.length]}
                  opacity={selectedRegion && selectedRegion !== entry.region ? 0.5 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
