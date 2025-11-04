import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, AlertCircle } from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const { toast } = useToast();
  const { roles } = useUserRole();

  useEffect(() => {
    fetchProfile();
    fetchMyLeaveRequests();
    fetchMyTickets();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(data);
    }
  };

  const fetchMyLeaveRequests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setLeaveRequests(data || []);
    }
  };

  const fetchMyTickets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('it_tickets')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });
      setMyTickets(data || []);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
        department: formData.get('department') as string,
      })
      .eq('id', profile.id);

    if (error) {
      toast({ title: "Error updating profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
      fetchProfile();
    }
  };

  const submitLeaveRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from('leave_requests')
      .insert([{
        user_id: session?.user.id,
        leave_type: formData.get('leave_type') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        reason: formData.get('reason') as string,
      }]);

    if (error) {
      toast({ title: "Error submitting leave request", variant: "destructive" });
    } else {
      toast({ title: "Leave request submitted" });
      fetchMyLeaveRequests();
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your personal information and requests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" defaultValue={profile?.full_name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" defaultValue={profile?.phone || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" name="department" defaultValue={profile?.department || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Roles</Label>
                  <div className="flex gap-2">
                    {roles.map(role => (
                      <Badge key={role}>{role}</Badge>
                    ))}
                  </div>
                </div>
                <Button type="submit">Update Profile</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Request Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLeaveRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leave_type">Leave Type</Label>
                  <Input id="leave_type" name="leave_type" placeholder="Vacation, Sick, etc." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" name="start_date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" name="end_date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input id="reason" name="reason" placeholder="Brief explanation" />
                </div>
                <Button type="submit">Submit Request</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>{leave.leave_type}</TableCell>
                    <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={leave.status === 'approved' ? 'default' : leave.status === 'pending' ? 'secondary' : 'destructive'}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(leave.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              My IT Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
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
