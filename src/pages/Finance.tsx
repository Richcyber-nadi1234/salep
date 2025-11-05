import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { RevenueChart } from "@/components/RevenueChart";
import { RegionChart } from "@/components/RegionChart";
import { TransactionTable } from "@/components/TransactionTable";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Finance() {
  const { transactions } = useTransactions();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [topSales, setTopSales] = useState<any[]>([]);

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

  useEffect(() => {
    fetchExpenses();
    fetchTopSales();

    const channel = supabase
      .channel('expense-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpenses)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactions]);

  const fetchTopSales = async () => {
    const userRevenue = new Map<string, number>();
    transactions.forEach((t) => {
      userRevenue.set(t.user_id, (userRevenue.get(t.user_id) || 0) + Number(t.sale_amount));
    });

    const topUsers = Array.from(userRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const userIds = topUsers.map(([id]) => id);
    if (userIds.length === 0) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    const salesPeople = topUsers.map(([userId, revenue]) => {
      const profile = profiles?.find(p => p.id === userId);
      return {
        ...profile,
        revenue,
        transactions: transactions.filter(t => t.user_id === userId).length
      };
    });

    setTopSales(salesPeople);
  };

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select(`
        *,
        profiles:user_id (full_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false });
    setExpenses(data || []);
  };

  const handleExpenseAction = async (id: string, status: 'approved' | 'rejected') => {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase
      .from('expenses')
      .update({ 
        status, 
        reviewed_by: session?.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').length;

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Finance Dashboard
            </h1>
            <p className="text-muted-foreground">
              Ghana Regional Sales Analytics & Expense Management
            </p>
          </div>
          <AddTransactionDialog />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Total Revenue"
            value={`GH₵${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12.5%"
          />
          <KPICard
            title="Total Expenses"
            value={`GH₵${totalExpenses.toLocaleString()}`}
            icon={TrendingDown}
            trend="+8.2%"
          />
          <KPICard
            title="Net Income"
            value={`GH₵${(totalRevenue - totalExpenses).toLocaleString()}`}
            icon={TrendingUp}
            trend="+15.3%"
          />
          <KPICard
            title="Pending Claims"
            value={pendingExpenses.toString()}
            icon={FileText}
            trend="0"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
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
            <CardTitle>Expense Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={expense.profiles?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {expense.profiles?.full_name?.charAt(0) || expense.profiles?.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{expense.profiles?.full_name || expense.profiles?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>GH₵{Number(expense.amount).toLocaleString()}</TableCell>
                    <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant={expense.status === 'approved' ? 'default' : expense.status === 'pending' ? 'secondary' : 'destructive'}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {expense.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleExpenseAction(expense.id, 'approved')}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleExpenseAction(expense.id, 'rejected')}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Sales People</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Deals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSales.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={person.avatar_url || ''} />
                            <AvatarFallback>
                              {person.full_name?.charAt(0) || person.email?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{person.full_name || person.email}</div>
                            <div className="text-xs text-muted-foreground">{person.department || 'Sales'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        GH₵{person.revenue?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{person.transactions || 0}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={transactions.slice(0, 5)} selectedRegion={null} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
