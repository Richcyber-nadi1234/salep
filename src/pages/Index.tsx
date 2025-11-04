import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { useTransactions } from "@/hooks/useTransactions";
import { useUserRole } from "@/hooks/useUserRole";
import { DollarSign, TrendingUp, Users, Building2 } from "lucide-react";
import { RevenueChart } from "@/components/RevenueChart";
import { RegionChart } from "@/components/RegionChart";
import { useMemo } from "react";

export default function Index() {
  const { transactions } = useTransactions();
  const { roles } = useUserRole();

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

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Welcome to OrgManage
          </h1>
          <p className="text-muted-foreground">
            Your organizational management dashboard - Roles: {roles.join(', ') || 'user'}
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
            title="Transactions"
            value={transactions.length.toString()}
            icon={TrendingUp}
            trend="+8.2%"
          />
          <KPICard
            title="Employees"
            value="247"
            icon={Users}
            trend="+5"
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
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <RegionChart data={regionChartData} onRegionClick={() => {}} selectedRegion={null} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Access Your Section</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate using the sidebar to access your department-specific tools and data.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">View Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Update your personal information and submit leave requests.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  All data updates in real-time across all sections.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
