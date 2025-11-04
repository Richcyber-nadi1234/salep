import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { useTransactions } from "@/hooks/useTransactions";
import { Building2, Users, Laptop, DollarSign, TrendingUp, FileText } from "lucide-react";
import { RevenueChart } from "@/components/RevenueChart";
import { RegionChart } from "@/components/RegionChart";
import { useMemo } from "react";

export default function CEO() {
  const { transactions } = useTransactions();

  const totalRevenue = useMemo(() => 
    transactions.reduce((sum, t) => sum + Number(t.sale_amount), 0), 
    [transactions]
  );

  const revenueChartData = useMemo(() => {
    const dailyRevenue = new Map<string, number>();
    transactions.forEach((t) => {
      const date = t.date;
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + Number(t.sale_amount));
    });
    return Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [transactions]);

  const regionChartData = useMemo(() => {
    const regionRevenue = new Map<string, number>();
    transactions.forEach((t) => {
      regionRevenue.set(t.region, (regionRevenue.get(t.region) || 0) + Number(t.sale_amount));
    });
    return Array.from(regionRevenue.entries())
      .map(([region, revenue]) => ({ region, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [transactions]);

  const avgTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            CEO Dashboard
          </h1>
          <p className="text-muted-foreground">
            Executive overview of all organizational metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Revenue"
            value={`GH₵${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12.5%"
          />
          <KPICard
            title="Active Employees"
            value="247"
            icon={Users}
            trend="+5"
          />
          <KPICard
            title="IT Assets"
            value="342"
            icon={Laptop}
            trend="+18"
          />
          <KPICard
            title="Departments"
            value="8"
            icon={Building2}
            trend="0"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Regional Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RegionChart data={regionChartData} onRegionClick={() => {}} selectedRegion={null} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Leave Requests</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Expense Claims</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">IT Tickets</span>
                  <span className="font-semibold">5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">HR</span>
                  <span className="text-green-500 font-semibold">Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">IT</span>
                  <span className="text-green-500 font-semibold">Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Finance</span>
                  <span className="text-yellow-500 font-semibold">Fair</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Transaction</span>
                  <span className="font-semibold">GH₵{avgTransaction.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Open Positions</span>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Satisfaction</span>
                  <span className="font-semibold">92%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
