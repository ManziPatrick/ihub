import { useEffect, useCallback, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "@/contexts/AuthContext";
import { GET_ADMIN_COMMISSION_REPORT } from "@/lib/graphql/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Percent,
  Receipt,
  Globe,
  BookOpen,
  Briefcase,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { CommissionSidebar } from "@/components/portal/CommissionSidebar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

export default function AdminCommissionDashboard() {
  const { user } = useAuth();
  const adminId = user?.id || "";

  const { data, loading, error, refetch } = useQuery(GET_ADMIN_COMMISSION_REPORT, {
    variables: { adminId },
    skip: !adminId,
    pollInterval: 60000,
  });

  const report: CommissionReport | null = (data as any)?.getAdminCommissionReport || null;

  const getScopeIcon = (s: string) => {
    switch (s) {
      case "global": return <Globe className="w-3.5 h-3.5" />;
      case "course": return <BookOpen className="w-3.5 h-3.5" />;
      case "internship": return <Briefcase className="w-3.5 h-3.5" />;
      default: return <Percent className="w-3.5 h-3.5" />;
    }
  };

  const getScopeBadge = (s: string) => {
    switch (s) {
      case "global": return <Badge variant="outline" className="text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> Global</Badge>;
      case "course": return <Badge variant="outline" className="text-xs flex items-center gap-1"><BookOpen className="w-3 h-3" /> Course</Badge>;
      case "internship": return <Badge variant="outline" className="text-xs flex items-center gap-1"><Briefcase className="w-3 h-3" /> Internship</Badge>;
      default: return null;
    }
  };

  const entries = report?.commissionEntries || [];

  // ─── Pagination for entries table ────────────────────────────────────
  const ENTRIES_PER_PAGE = 10;
  const [entryPage, setEntryPage] = useState(1);
  const totalEntryPages = Math.ceil(entries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = entries.slice(
    (entryPage - 1) * ENTRIES_PER_PAGE,
    entryPage * ENTRIES_PER_PAGE
  );

  // Reset page when entries change
  useEffect(() => {
    setEntryPage(1);
  }, [entries.length]);

  // Aggregate by scope for visual breakdown
  const byScope = entries.reduce((acc: Record<string, number>, e) => {
    acc[e.scope] = (acc[e.scope] || 0) + e.commissionAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <PortalLayout>
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Commission Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Track your earnings from course and internship payments
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                <DollarSign className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {report?.totalCommission?.toLocaleString() || 0} RWF
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Payments Processed</CardTitle>
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report?.totalPayments || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Completed payments with commission</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Scope Configs</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(byScope).length}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(byScope).map(([scope, amount]) => (
                    <Badge key={scope} variant="secondary" className="text-xs flex items-center gap-1">
                      {getScopeIcon(scope)}
                      {scope}: {Math.round(amount).toLocaleString()} RWF
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
              <CardDescription>
                Detailed list of commission earned from each payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="font-medium">No commission entries yet</p>
                  <p className="text-sm mt-1">
                    Commissions appear when payments are processed and commission configs are set
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Scope</TableHead>
                          <TableHead>Scope Title</TableHead>
                          <TableHead>Payment Amount</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedEntries.map((entry, idx) => (
                          <TableRow key={`${entry.paymentId}-${entryPage}-${idx}`}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {entry.createdAt
                                ? new Date(entry.createdAt).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {entry.itemTitle || "Payment"}
                            </TableCell>
                            <TableCell>{getScopeBadge(entry.scope)}</TableCell>
                            <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                              {entry.scopeTitle || "—"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {entry.amount?.toLocaleString()} RWF
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {entry.commissionPercentage}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {entry.commissionAmount?.toLocaleString()} RWF
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalEntryPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Showing {(entryPage - 1) * ENTRIES_PER_PAGE + 1}–{Math.min(entryPage * ENTRIES_PER_PAGE, entries.length)} of {entries.length}
                      </span>
                      <Pagination className="w-auto mx-0">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => { e.preventDefault(); setEntryPage(p => Math.max(1, p - 1)); }}
                              className={entryPage <= 1 ? "pointer-events-none opacity-40" : ""}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalEntryPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalEntryPages || Math.abs(p - entryPage) <= 1)
                            .map((p, idx, arr) => (
                              <span key={p}>
                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    href="#"
                                    isActive={p === entryPage}
                                    onClick={(e) => { e.preventDefault(); setEntryPage(p); }}
                                  >
                                    {p}
                                  </PaginationLink>
                                </PaginationItem>
                              </span>
                            ))}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => { e.preventDefault(); setEntryPage(p => Math.min(totalEntryPages, p + 1)); }}
                              className={entryPage >= totalEntryPages ? "pointer-events-none opacity-40" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <CommissionSidebar report={report} loading={loading} error={error} onRefresh={() => refetch()} />
        </div>
      </div>
    </div>
    </PortalLayout>
  );
}
