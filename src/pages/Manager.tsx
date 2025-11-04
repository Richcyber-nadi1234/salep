import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Manager() {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaveRequests();
    fetchTeamMembers();

    const channel = supabase
      .channel('manager-leave-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, fetchLeaveRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaveRequests = async () => {
    const { data } = await supabase
      .from('leave_requests')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order('created_at', { ascending: false });
    setLeaveRequests(data || []);
  };

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .limit(20);
    setTeamMembers(data || []);
  };

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase
      .from('leave_requests')
      .update({ 
        status, 
        reviewed_by: session?.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);
  };

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
  const approvedLeaves = leaveRequests.filter(l => l.status === 'approved').length;

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground">
            Team management and approvals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Team Members"
            value={teamMembers.length.toString()}
            icon={Users}
            trend="+2"
          />
          <KPICard
            title="Pending Approvals"
            value={pendingLeaves.toString()}
            icon={Clock}
            trend="0"
          />
          <KPICard
            title="Approved Leaves"
            value={approvedLeaves.toString()}
            icon={CheckCircle}
            trend="+5"
          />
          <KPICard
            title="Active Projects"
            value="12"
            icon={Calendar}
            trend="+3"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Approval Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>{leave.profiles?.full_name || leave.profiles?.email}</TableCell>
                    <TableCell>{leave.leave_type}</TableCell>
                    <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                    <TableCell>
                      <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'pending' ? 'secondary' : 'destructive'}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleLeaveAction(leave.id, 'approved')}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleLeaveAction(leave.id, 'rejected')}>
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

        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.full_name || 'N/A'}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.department || 'N/A'}</TableCell>
                    <TableCell>{member.phone || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
