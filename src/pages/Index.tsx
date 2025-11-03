import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, DollarSign, TrendingUp, Users, RefreshCw, LogOut } from "lucide-react";
import { format, subDays, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { KPICard } from "@/components/KPICard";
import { RevenueChart } from "@/components/RevenueChart";
import { RegionChart } from "@/components/RegionChart";
import { TransactionTable } from "@/components/TransactionTable";
import { DateRange } from "react-day-picker";
import { useTransactions } from "@/hooks/useTransactions";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { transactions: dbTransactions, loading } = useTransactions();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  // Filter transactions based on date range and region
  const filteredTransactions = useMemo(() => {
    let filtered = dbTransactions;

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        return isWithinInterval(transactionDate, {
          start: dateRange.from!,
          end: dateRange.to!,
        });
      });
    }

    // Filter by region dropdown
    if (regionFilter !== "all") {
      filtered = filtered.filter((t) => t.region === regionFilter);
    }

    // Filter by selected region from chart
    if (selectedRegion) {
      filtered = filtered.filter((t) => t.region === selectedRegion);
    }

    return filtered;
  }, [dbTransactions, dateRange, regionFilter, selectedRegion]);

  // Calculate KPIs
  const { totalRevenue, avgDealSize, conversionRate, previousRevenue } = useMemo(() => {
    const closedWon = filteredTransactions.filter((t) => t.status === "Closed Won");
    const total = closedWon.reduce((sum, t) => sum + t.sale_amount, 0);
    const avg = closedWon.length > 0 ? total / closedWon.length : 0;
    const conversion = filteredTransactions.length > 0 
      ? (closedWon.length / filteredTransactions.length) * 100 
      : 0;

    // Calculate previous period revenue for comparison
    const daysDiff = dateRange?.from && dateRange?.to 
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    const previousStart = dateRange?.from ? subDays(dateRange.from, daysDiff) : subDays(new Date(), 60);
    const previousEnd = dateRange?.from ? subDays(dateRange.from, 1) : subDays(new Date(), 31);
    
    const previousTransactions = dbTransactions.filter((t) => {
      const date = new Date(t.date);
      return isWithinInterval(date, { start: previousStart, end: previousEnd }) && 
             t.status === "Closed Won";
    });
    
    const prevTotal = previousTransactions.reduce((sum, t) => sum + t.sale_amount, 0);

    return {
      totalRevenue: total,
      avgDealSize: avg,
      conversionRate: conversion,
      previousRevenue: prevTotal,
    };
  }, [filteredTransactions, dateRange, dbTransactions]);

  // Prepare chart data
  const revenueChartData = useMemo(() => {
    const dailyRevenue = new Map<string, number>();

    filteredTransactions
      .filter((t) => t.status === "Closed Won")
      .forEach((t) => {
        const date = t.date;
        dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + t.sale_amount);
      });

    return Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date: format(new Date(date), "MMM dd"), revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }, [filteredTransactions]);

  const regionChartData = useMemo(() => {
    const regionRevenue = new Map<string, number>();

    filteredTransactions
      .filter((t) => t.status === "Closed Won")
      .forEach((t) => {
        regionRevenue.set(t.region, (regionRevenue.get(t.region) || 0) + t.sale_amount);
      });

    return Array.from(regionRevenue.entries())
      .map(([region, revenue]) => ({ region, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredTransactions]);

  const revenueChange = previousRevenue > 0
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  const regions = Array.from(new Set(dbTransactions.map((t) => t.region)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sales Performance Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Ghana Regional Sales Analytics</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <AddTransactionDialog />
              
              {/* Region Filter */}
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[180px] bg-background border-border">
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal bg-background border-border",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Clear Selection */}
              {selectedRegion && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRegion(null)}
                  className="bg-background border-border"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
              )}

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-background border-border"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            change={revenueChange}
            changeLabel="vs previous period"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <KPICard
            title="Average Deal Size"
            value={`$${Math.round(avgDealSize).toLocaleString()}`}
            change={12.5}
            changeLabel="vs previous period"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KPICard
            title="Conversion Rate"
            value={`${conversionRate.toFixed(1)}%`}
            change={-3.2}
            changeLabel="vs previous period"
            icon={<Users className="h-5 w-5" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={revenueChartData} />
          <RegionChart
            data={regionChartData}
            onRegionClick={setSelectedRegion}
            selectedRegion={selectedRegion}
          />
        </div>

        {/* Transaction Table */}
        <TransactionTable
          transactions={filteredTransactions.slice(0, 50)}
          selectedRegion={selectedRegion}
        />
      </main>
    </div>
  );
};

export default Index;
