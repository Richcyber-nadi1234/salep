import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  transactions: Transaction[];
  selectedRegion: string | null;
}

export const TransactionTable = ({ transactions, selectedRegion }: TransactionTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Closed Won":
        return "bg-success/10 text-success border-success/20";
      case "In Progress":
        return "bg-accent/10 text-accent border-accent/20";
      case "Closed Lost":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Transaction Details
          {selectedRegion && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              - {selectedRegion}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="font-semibold">Transaction ID</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Region</TableHead>
                  <TableHead className="font-semibold">Segment</TableHead>
                  <TableHead className="font-semibold">Lead Source</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow 
                      key={transaction.transaction_id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-mono text-sm">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.region}</TableCell>
                      <TableCell>{transaction.customer_segment}</TableCell>
                      <TableCell>{transaction.lead_source}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${transaction.sale_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border", getStatusColor(transaction.status))}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
