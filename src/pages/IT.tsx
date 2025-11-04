import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { Laptop, Package, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function IT() {
  const [assets, setAssets] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchAssets();
    fetchTickets();

    const assetsChannel = supabase
      .channel('assets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'it_assets' }, fetchAssets)
      .subscribe();

    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'it_tickets' }, fetchTickets)
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, []);

  const fetchAssets = async () => {
    const { data } = await supabase
      .from('it_assets')
      .select(`
        *,
        profiles:assigned_to (full_name, email)
      `)
      .order('created_at', { ascending: false });
    setAssets(data || []);
  };

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('it_tickets')
      .select(`
        *,
        creator:created_by (full_name, email),
        assignee:assigned_to (full_name, email)
      `)
      .order('created_at', { ascending: false });
    setTickets(data || []);
  };

  const availableAssets = assets.filter(a => a.status === 'available').length;
  const assignedAssets = assets.filter(a => a.status === 'assigned').length;
  const openTickets = tickets.filter(t => t.status === 'open').length;

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              IT Management
            </h1>
            <p className="text-muted-foreground">
              Asset tracking and support tickets
            </p>
          </div>
          <Button>
            <Package className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard
            title="Total Assets"
            value={assets.length.toString()}
            icon={Laptop}
            trend="+8"
          />
          <KPICard
            title="Available"
            value={availableAssets.toString()}
            icon={CheckCircle}
            trend="+3"
          />
          <KPICard
            title="Assigned"
            value={assignedAssets.toString()}
            icon={Package}
            trend="+5"
          />
          <KPICard
            title="Open Tickets"
            value={openTickets.toString()}
            icon={AlertCircle}
            trend="-2"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>IT Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.priority === 'critical' ? 'destructive' : ticket.priority === 'high' ? 'default' : 'secondary'}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.creator?.full_name || ticket.creator?.email}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.assignee?.full_name || 'Unassigned'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warranty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.asset_name}</TableCell>
                    <TableCell>{asset.asset_type}</TableCell>
                    <TableCell>{asset.serial_number}</TableCell>
                    <TableCell>{asset.profiles?.full_name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === 'available' ? 'default' : 'secondary'}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'}
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
