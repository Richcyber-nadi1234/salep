import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTransactions } from "@/hooks/useTransactions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Award, Target, Calendar } from "lucide-react";
import { KPICard } from "@/components/KPICard";

export default function Performance() {
  const { transactions } = useTransactions();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [comparisonUser, setComparisonUser] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("30");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, department');
    
    if (profiles) {
      setUsers(profiles);
    }
  };

  const filteredTransactions = useMemo(() => {
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const isWithinRange = transactionDate >= cutoffDate;
      
      if (selectedUser === "all") return isWithinRange;
      return isWithinRange && t.user_id === selectedUser;
    });
  }, [transactions, selectedUser, timeRange]);

  const chartData = useMemo(() => {
    const dailyData = new Map<string, { date: string; revenue: number; comparison?: number }>();

    filteredTransactions.forEach(t => {
      const existing = dailyData.get(t.date) || { date: t.date, revenue: 0 };
      existing.revenue += Number(t.sale_amount);
      dailyData.set(t.date, existing);
    });

    // Add comparison data if selected
    if (comparisonUser && comparisonUser !== selectedUser) {
      transactions
        .filter(t => t.user_id === comparisonUser)
        .forEach(t => {
          const existing = dailyData.get(t.date);
          if (existing) {
            existing.comparison = (existing.comparison || 0) + Number(t.sale_amount);
          } else {
            dailyData.set(t.date, { date: t.date, revenue: 0, comparison: Number(t.sale_amount) });
          }
        });
    }

    return Array.from(dailyData.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-parseInt(timeRange));
  }, [filteredTransactions, comparisonUser, selectedUser, transactions, timeRange]);

  const performanceData = useMemo(() => {
    const userPerformance = new Map<string, { totalRevenue: number; deals: number; avgDeal: number }>();

    transactions.forEach(t => {
      const existing = userPerformance.get(t.user_id) || { totalRevenue: 0, deals: 0, avgDeal: 0 };
      existing.totalRevenue += Number(t.sale_amount);
      existing.deals += 1;
      userPerformance.set(t.user_id, existing);
    });

    return Array.from(userPerformance.entries())
      .map(([userId, stats]) => {
        const user = users.find(u => u.id === userId);
        return {
          userId,
          name: user?.full_name || user?.email || 'Unknown',
          avatar: user?.avatar_url,
          ...stats,
          avgDeal: stats.totalRevenue / stats.deals
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }, [transactions, users]);

  const selectedUserStats = useMemo(() => {
    if (selectedUser === "all") {
      return {
        totalRevenue: filteredTransactions.reduce((sum, t) => sum + Number(t.sale_amount), 0),
        deals: filteredTransactions.length,
        avgDeal: filteredTransactions.length > 0 
          ? filteredTransactions.reduce((sum, t) => sum + Number(t.sale_amount), 0) / filteredTransactions.length 
          : 0
      };
    }

    const userTransactions = filteredTransactions.filter(t => t.user_id === selectedUser);
    return {
      totalRevenue: userTransactions.reduce((sum, t) => sum + Number(t.sale_amount), 0),
      deals: userTransactions.length,
      avgDeal: userTransactions.length > 0 
        ? userTransactions.reduce((sum, t) => sum + Number(t.sale_amount), 0) / userTransactions.length 
        : 0
    };
  }, [filteredTransactions, selectedUser]);

  const selectedUserInfo = users.find(u => u.id === selectedUser);
  const comparisonUserInfo = users.find(u => u.id === comparisonUser);

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Performance Analytics
          </h1>
          <p className="text-muted-foreground">
            Track and compare individual and team performance metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Employee</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Compare With</Label>
                <Select value={comparisonUser} onValueChange={setComparisonUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select to compare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {users
                      .filter(u => u.id !== selectedUser)
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Time Range</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedUser !== "all" && selectedUserInfo && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUserInfo.avatar_url || ''} />
                    <AvatarFallback>
                      {selectedUserInfo.full_name?.charAt(0) || selectedUserInfo.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{selectedUserInfo.full_name || selectedUserInfo.email}</div>
                    <div className="text-xs text-muted-foreground">{selectedUserInfo.department || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Total Revenue"
            value={`GH₵${selectedUserStats.totalRevenue.toLocaleString()}`}
            icon={TrendingUp}
            trend="+12%"
          />
          <KPICard
            title="Deals Closed"
            value={selectedUserStats.deals.toString()}
            icon={Award}
            trend="+8"
          />
          <KPICard
            title="Avg Deal Size"
            value={`GH₵${selectedUserStats.avgDeal.toFixed(0)}`}
            icon={Target}
            trend="+5%"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sales Trend Over Time
              {comparisonUser && comparisonUserInfo && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (vs {comparisonUserInfo.full_name || comparisonUserInfo.email})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => `GH₵${value.toLocaleString()}`}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name={selectedUser === "all" ? "Total Revenue" : selectedUserInfo?.full_name || "Revenue"}
                  dot={{ r: 3 }}
                />
                {comparisonUser && (
                  <Line 
                    type="monotone" 
                    dataKey="comparison" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name={comparisonUserInfo?.full_name || "Comparison"}
                    dot={{ r: 3 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `GH₵${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" name="Total Revenue" />
                <Bar dataKey="deals" fill="hsl(var(--chart-2))" name="Deals Closed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
