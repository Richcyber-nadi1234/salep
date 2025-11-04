import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { Users, UserPlus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function HR() {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaveRequests();
    fetchEmployees();

    const leaveChannel = supabase
      .channel('leave-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, fetchLeaveRequests)
      .subscribe();

    const empChannel = supabase
      .channel('employee-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchEmployees)
      .subscribe();

    return () => {
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(empChannel);
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

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .order('hire_date', { ascending: false });
    setEmployees(data || []);
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
  const activeEmployees = employees.filter(e => e.status === 'active').length;

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              HR Management
            </h1>
            <p className="text-muted-foreground">
              Employee management and leave requests
            </p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Total Employees"
            value={employees.length.toString()}
            icon={Users}
            trend="+5"
          />
          <KPICard
            title="Active Employees"
            value={activeEmployees.toString()}
            icon={UserPlus}
            trend="+2"
          />
          <KPICard
            title="Pending Leaves"
            value={pendingLeaves.toString()}
            icon={Calendar}
            trend="0"
          />
          <KPICard
            title="On Leave"
            value={employees.filter(e => e.status === 'on_leave').length.toString()}
            icon={Clock}
            trend="-1"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
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
            <CardTitle>Employee Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.employee_id}</TableCell>
                    <TableCell>{emp.profiles?.full_name || emp.profiles?.email}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>{new Date(emp.hire_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                        {emp.status}
                      </Badge>
                    </TableCell>
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
