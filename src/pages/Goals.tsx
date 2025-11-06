import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Award, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();
  const { roles } = useUserRole();

  const isManager = roles.includes('manager') || roles.includes('ceo');

  useEffect(() => {
    fetchGoals();
    fetchUsers();
    fetchTransactions();

    // Set up realtime listener for goals
    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals'
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setGoals(data);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url');
    
    if (data) {
      setUsers(data);
    }
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*');
    
    if (data) {
      setTransactions(data);
    }
  };

  const calculateProgress = (goal: any) => {
    const goalTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);
      return t.user_id === goal.user_id && 
             transactionDate >= startDate && 
             transactionDate <= endDate;
    });

    const currentAmount = goalTransactions.reduce((sum, t) => sum + Number(t.sale_amount), 0);
    const progress = (currentAmount / Number(goal.target_amount)) * 100;
    
    return {
      current: currentAmount,
      target: Number(goal.target_amount),
      progress: Math.min(progress, 100),
      remaining: Math.max(Number(goal.target_amount) - currentAmount, 0)
    };
  };

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: formData.get('user_id') as string,
        target_amount: Number(formData.get('target_amount')),
        period: formData.get('period') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        created_by: user.id
      });

    if (error) {
      toast({ title: "Error creating goal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Goal created successfully!" });
      setOpenDialog(false);
      fetchGoals();
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Sales Goals
            </h1>
            <p className="text-muted-foreground">
              Track and manage sales targets and performance
            </p>
          </div>
          {isManager && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Set New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Sales Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_id">Employee</Label>
                    <Select name="user_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_amount">Target Amount (GH₵)</Label>
                    <Input
                      id="target_amount"
                      name="target_amount"
                      type="number"
                      required
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period">Period</Label>
                    <Select name="period" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="date"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Goal</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => {
            const user = users.find(u => u.id === goal.user_id);
            const stats = calculateProgress(goal);
            
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar_url || ''} />
                      <AvatarFallback>
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">{user?.full_name || user?.email}</div>
                      <Badge variant="secondary" className="text-xs">
                        {goal.period}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {goal.status === 'completed' ? 'Completed' : 'In Progress'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{stats.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.progress} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Current</div>
                      <div className="text-lg font-bold text-primary">
                        GH₵{stats.current.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Target</div>
                      <div className="text-lg font-bold">
                        GH₵{stats.target.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {stats.remaining > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Remaining</div>
                      <div className="font-semibold">GH₵{stats.remaining.toLocaleString()}</div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.end_date).toLocaleDateString()}
                  </div>

                  {stats.progress >= 100 && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Award className="h-4 w-4" />
                      Goal Achieved!
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {goals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No goals set yet</p>
              {isManager && (
                <Button onClick={() => setOpenDialog(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Set First Goal
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}