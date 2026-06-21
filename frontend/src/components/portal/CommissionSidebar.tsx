import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Percent,
  Globe,
  BookOpen,
  Briefcase,
  TrendingUp,
  Receipt,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommissionEntry {
  paymentId: string;
  itemTitle: string;
  type: string;
  amount: number;
  commissionPercentage: number;
  commissionAmount: number;
  scope: string;
  scopeTitle?: string;
  createdAt: string;
}

interface CommissionReport {
  adminId: string;
  totalCommission: number;
  totalPayments: number;
  commissionEntries: CommissionEntry[];
}

interface CommissionSidebarProps {
  report: CommissionReport | null;
  loading: boolean;
  error?: Error | undefined;
  onRefresh?: () => void;
}

export function CommissionSidebar({ report, loading, error, onRefresh }: CommissionSidebarProps) {
  const entries = report?.commissionEntries || [];

  // Aggregate by scope
  const byScope = entries.reduce((acc: Record<string, { count: number; amount: number }>, e) => {
    if (!acc[e.scope]) acc[e.scope] = { count: 0, amount: 0 };
    acc[e.scope].count += 1;
    acc[e.scope].amount += e.commissionAmount;
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  const getScopeIcon = (s: string) => {
    switch (s) {
      case "global": return <Globe className="w-3.5 h-3.5" />;
      case "course": return <BookOpen className="w-3.5 h-3.5" />;
      case "internship": return <Briefcase className="w-3.5 h-3.5" />;
      default: return <Percent className="w-3.5 h-3.5" />;
    }
  };

  const getScopeLabel = (s: string) => {
    switch (s) {
      case "global": return "Global";
      case "course": return "Courses";
      case "internship": return "Internships";
      default: return s;
    }
  };

  // Top 5 recent entries
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <p className="text-sm font-medium text-destructive">Failed to load</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          {onRefresh && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={onRefresh}>
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Commission Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 overflow-hidden">
        <div className="h-1 w-full bg-primary" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Total Commission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {report?.totalCommission?.toLocaleString() || 0} RWF
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Receipt className="w-3 h-3" />
            From {report?.totalPayments || 0} completed {report?.totalPayments === 1 ? "payment" : "payments"}
          </div>
        </CardContent>
      </Card>

      {/* Scope Breakdown */}
      {Object.keys(byScope).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="w-3.5 h-3.5" />
              Earnings by Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(byScope).map(([scope, { count, amount }]) => (
              <div
                key={scope}
                className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    {getScopeIcon(scope)}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{getScopeLabel(scope)}</p>
                    <p className="text-[10px] text-muted-foreground">{count} {count === 1 ? "entry" : "entries"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{Math.round(amount).toLocaleString()} RWF</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top 5 Most Recent Commission Entries */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              Recent Commissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentEntries.map((entry, idx) => (
              <div
                key={`${entry.paymentId}-${idx}`}
                className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{entry.itemTitle || "Payment"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {entry.commissionPercentage}%
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary ml-2 whitespace-nowrap">
                  {entry.commissionAmount?.toLocaleString()} RWF
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      {entries.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                // Build CSV rows
                const headers = ["Payment ID", "Item", "Type", "Amount", "Commission %", "Commission Amount", "Scope", "Scope Title", "Date"];
                const rows = entries.map(e => [
                  e.paymentId,
                  `"${(e.itemTitle || "Payment").replace(/"/g, '""')}"`,
                  e.type,
                  e.amount,
                  e.commissionPercentage,
                  e.commissionAmount,
                  e.scope,
                  `"${(e.scopeTitle || "").replace(/"/g, '""')}"`,
                  e.createdAt ? new Date(e.createdAt).toISOString().split("T")[0] : "",
                ]);

                // Summary row
                const summaryRow = ["", "TOTAL", "", report?.totalPayments || 0, "", report?.totalCommission || 0, "", "", ""];

                const csv = [
                  headers.join(","),
                  ...rows.map(r => r.join(",")),
                  summaryRow.join(","),
                ].join("\n");

                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `commission-report-${new Date().toISOString().split("T")[0]}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Report (CSV)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No commission data yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Earnings appear once commission configs are active and payments are processed
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
