import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Search,
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Send,
  Ban,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { GET_PAYMENTS, GET_ALL_DISBURSEMENTS, GET_DISBURSEMENT_STATS } from "@/lib/graphql/queries";
import { toast } from "sonner";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { VerifyPaymentDialog } from "@/components/portal/dialogs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  pending: "bg-orange-500/20 text-orange-400",
  failed: "bg-red-500/20 text-red-400",
  paid: "bg-green-500/20 text-green-400", // Add 'paid' mapping if needed
};

const statusIcons: Record<string, React.ElementType> = {
  completed: CheckCircle,
  paid: CheckCircle,
  pending: Clock,
  failed: XCircle,
};

export default function AdminPayments() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, loading, refetch: refetchPayments } = usePaginatedQuery(GET_PAYMENTS, {
    variables: { page: currentPage, limit: pageSize },
  });

  // Disbursement queries — admins can now see their scoped disbursements
  const [disbPage, setDisbPage] = useState(1);
  const [disbStatus, setDisbStatus] = useState("");
  const LIMIT = 20;
  const { data: disbData, loading: disbLoading, refetch: refetchDisb } = useQuery(GET_ALL_DISBURSEMENTS, {
    variables: { page: disbPage, limit: LIMIT, status: disbStatus || undefined },
  });

  const { data: disbStatsData, loading: disbStatsLoading, refetch: refetchDisbStats } = useQuery(GET_DISBURSEMENT_STATS);

  const disbursements: any[] = (disbData as any)?.getAllDisbursements?.items || [];
  // Guard: the disbursements query can fail or return null for admins without
  // disbursement access — fall back to an empty pagination object so the page
  // never crashes on `disbPagination.totalPages`.
  const disbPagination = (disbData as any)?.getAllDisbursements?.pagination || { totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false };
  const disbStats = (disbStatsData as any)?.getDisbursementStats;

  const payments = (data as any)?.payments?.items || [];
  const pagination = (data as any)?.payments?.pagination || { totalPages: 0, totalCount: 0, hasPreviousPage: false, hasNextPage: false };

  // Calculate stats
  const totalRevenue = payments
    .filter((p: any) => p.status === 'completed' || p.status === 'paid')
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const now = new Date();
  const thisMonthRevenue = payments
    .filter((p: any) => {
      const pDate = new Date(p.date);
      return (p.status === 'completed' || p.status === 'paid') &&
        pDate.getMonth() === now.getMonth() &&
        pDate.getFullYear() === now.getFullYear();
    })
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const pendingPayments = payments.filter((p: any) => p.status === 'pending');
  const pendingValue = pendingPayments.reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const internshipRevenue = payments
    .filter((p: any) => (p.status === 'completed' || p.status === 'paid') && p.type === 'Internship Fee')
    .reduce((acc: number, curr: any) => acc + curr.amount, 0);

  const paymentStats = [
    { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} RWF`, change: "Overall", trend: "up", icon: DollarSign },
    { label: "This Month", value: `${thisMonthRevenue.toLocaleString()} RWF`, change: "Current Period", trend: "up", icon: TrendingUp },
    { label: "Pending", value: `${pendingValue.toLocaleString()} RWF`, change: `${pendingPayments.length} payments`, trend: "neutral", icon: Clock },
    { label: "Opportunity Fees", value: `${internshipRevenue.toLocaleString()} RWF`, change: "Total", trend: "up", icon: CreditCard },
  ];

  const filteredPayments = payments.filter((payment: any) =>
    (payment.studentName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (payment.itemTitle?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Payments
            </h1>
            <p className="text-muted-foreground mt-1">
              Track course enrollments and opportunity fee payments
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => {
                setIsRefreshing(true);
                try {
                  await Promise.all([refetchPayments(), refetchDisb(), refetchDisbStats()]);
                  toast.success('Payments refreshed!');
                } catch {
                  toast.error('Failed to refresh payments');
                } finally {
                  setIsRefreshing(false);
                }
              }} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {paymentStats.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-card-foreground/60 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs text-card-foreground/60`}>
                      {stat.change}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="disbursements">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Disbursements
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* All Transactions */}
          <TabsContent value="all">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left p-4 text-sm font-medium text-card-foreground/70">Student</th>
                          <th className="text-left p-4 text-sm font-medium text-card-foreground/70">Type</th>
                          <th className="text-left p-4 text-sm font-medium text-card-foreground/70">Item</th>
                          <th className="text-right p-4 text-sm font-medium text-card-foreground/70">Amount</th>
                          <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Date</th>
                          <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Status</th>
                          <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Method</th>
                          <th className="text-right p-4 text-sm font-medium text-card-foreground/70">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.length === 0 ? (
                          <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">No payments found.</td></tr>
                        ) : (
                          filteredPayments.map((payment: any) => (
                            <AdminPaymentRow 
                              key={payment.id} 
                              payment={payment} 
                              setVerifyingPayment={setVerifyingPayment} 
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <PaginationBar
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={setCurrentPage}
                hasPreviousPage={pagination.hasPreviousPage}
                hasNextPage={pagination.hasNextPage}
                pageSize={pageSize}
                onPageSizeChange={(v) => { setPageSize(v); setCurrentPage(1); }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </motion.div>
          </TabsContent>

          {/* Pending Payments */}
          <TabsContent value="pending">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    Pending Payments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payments.filter((p: any) => p.status === 'pending').length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">No pending payments.</div>
                  ) : (
                    payments.filter((p: any) => p.status === 'pending').map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/30"
                      >
                        <div>
                          <h4 className="font-medium text-card-foreground">{payment.studentName}</h4>
                          <p className="text-sm text-card-foreground/60">{payment.type} - {payment.itemTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-accent">{payment.amount.toLocaleString()} {payment.currency}</p>
                          <div className="flex items-center gap-1 text-xs mt-1 text-card-foreground/60">
                            <Calendar className="w-3 h-3" />
                            <span>Date: {new Date(payment.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Send Reminder</Button>
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => setVerifyingPayment(payment)}
                          >
                            Verify Payment
                          </Button>
                        </div>
                      </div>
                    )))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          {/* Disbursements Tab */}
          <TabsContent value="disbursements">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {/* Disbursement Summary Cards */}
              {disbStats && !disbStatsLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold">{disbStats.totalDisbursements}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-blue-500">{disbStats.onHoldCount}</p>
                      <p className="text-xs text-muted-foreground">On Hold</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-green-500">{disbStats.successfulCount}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-amber-500">{disbStats.totalDisbursed?.toLocaleString()} RWF</p>
                      <p className="text-xs text-muted-foreground">Total Sent</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Additional Stats */}
              {disbStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-purple-500/5 border-purple-500/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-purple-500">{disbStats.pendingToDisburse?.toLocaleString()} RWF</p>
                      <p className="text-xs text-muted-foreground">Pending to Disburse</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-500/5 border-gray-500/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold">{disbStats.pendingCount}</p>
                      <p className="text-xs text-muted-foreground">Processing</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-red-500">{disbStats.failedCount}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-indigo-500/5 border-indigo-500/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-500">{disbStats.totalCommission?.toLocaleString()} RWF</p>
                      <p className="text-xs text-muted-foreground">Platform Commission</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Disbursements List */}
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                      <select
                        value={disbStatus || "__all__"}
                        onChange={(e) => {
                          setDisbStatus(e.target.value === "__all__" ? "" : e.target.value);
                          setDisbPage(1);
                        }}
                        className="bg-background border border-border/50 rounded-md px-2 py-1.5 text-xs"
                      >
                        <option value="__all__">All Statuses</option>
                        <option value="OnHold">On Hold</option>
                        <option value="Successful">Sent</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { refetchDisb(); refetchDisbStats(); }} className="text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                    </Button>
                  </div>

                  {disbLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : disbursements.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Send className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No disbursements found</p>
                      <p className="text-xs mt-1">Disbursements for your courses will appear here</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Gross</TableHead>
                          <TableHead>Net</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner Phone</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disbursements.map((d: any) => (
                          <TableRow key={d.id}>
                            <TableCell className="text-sm font-medium truncate max-w-[150px]">
                              {d.paymentId?.slice(-8) || d.itemId?.slice(-8)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {d.itemType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {d.grossAmount?.toLocaleString()} RWF
                            </TableCell>
                            <TableCell className="font-medium text-green-500">
                              {d.netAmount?.toLocaleString()} RWF
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                d.status === "Successful" ? "bg-green-500/20 text-green-500" :
                                d.status === "OnHold" ? "bg-blue-500/20 text-blue-500" :
                                d.status === "Pending" || d.status === "Processing" ? "bg-amber-500/20 text-amber-500" :
                                d.status === "Failed" ? "bg-red-500/20 text-red-500" :
                                "bg-gray-500/20 text-gray-500"
                              }>
                                {d.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{d.ownerPhone || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {disbPagination.totalPages > 0 && (
                    <PaginationBar
                      currentPage={disbPage}
                      totalPages={disbPagination.totalPages}
                      totalCount={disbPagination.totalCount}
                      onPageChange={setDisbPage}
                      hasPreviousPage={disbPage > 1}
                      hasNextPage={disbPage < disbPagination.totalPages}
                      showPageNumbers={false}
                      showFirstLast={false}
                      showRange={false}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Disbursement Policy:</strong></p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Disbursements are held for 15 days (refund period) before release</li>
                        <li>Only super admins can approve release of held funds</li>
                        <li>On Hold = awaiting approval period. Sent = funds disbursed to owner</li>
                        <li>Failed disbursements can be retried by super admin</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <VerifyPaymentDialog
          open={!!verifyingPayment}
          onOpenChange={(open) => !open && setVerifyingPayment(null)}
          payment={verifyingPayment}
        />
      </div>

    </PortalLayout>
  );
}

function AdminPaymentRow({ payment, setVerifyingPayment }: { payment: any, setVerifyingPayment: (p: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusIcons[payment.status] || Clock;
  
  const allItems = [...(payment.courses || []), ...(payment.internships || [])];
  // If we don't have nested items, try to use the itemTitle
  const hasItems = allItems.length > 0;

  // Compute a smart display title from actual item names (showing all items)
  const displayTitle = allItems.length > 0
    ? allItems.map((item: any) => item.title).join(", ")
    : payment.itemTitle;

  return (
    <tr className="border-b border-border/10 transition-colors hover:bg-accent/5 group">
      <td className="p-4">
        <p className="font-bold group-hover:text-foreground dark:group-hover:text-white transition-colors">
          {payment.studentName}
        </p>
      </td>
      <td className="p-4">
        <Badge variant="outline" className="text-[10px] font-bold border-border/50 uppercase tracking-tighter group-hover:border-accent/30 dark:group-hover:border-white/30 group-hover:text-foreground dark:group-hover:text-white transition-colors">
          {payment.type}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex flex-col">
          <p className="text-sm font-medium group-hover:text-foreground dark:group-hover:text-white transition-colors flex items-center gap-1.5 flex-wrap">
            {displayTitle}
          </p>
          {hasItems && (
            <div className="mt-1 flex flex-wrap gap-1 items-center">
              {allItems.map((item: any, idx: number) => (
                <span key={item.id || idx} className="text-[9px] px-1.5 py-0.5 bg-accent/5 text-accent group-hover:bg-accent/10 dark:group-hover:bg-white/10 group-hover:text-accent-foreground dark:group-hover:text-white group-hover:border-accent/30 dark:group-hover:border-white/20 border border-accent/10 rounded font-medium transition-colors">
                  {item.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="p-4 text-right">          <span className="font-bold text-accent group-hover:text-accent-foreground dark:group-hover:text-white transition-colors">
          {payment.amount.toLocaleString()} {payment.currency}
        </span>
      </td>
      <td className="p-4 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium group-hover:text-foreground dark:group-hover:text-white transition-colors">{new Date(payment.date).toLocaleDateString()}</span>
          <span className="text-[10px] text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-white/60 transition-colors">{new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </td>
      <td className="p-4 text-center">
        <Badge className={`${statusColors[payment.status] || "bg-gray-500/20 text-gray-400"} flex items-center gap-1 mx-auto w-fit px-2 group-hover:bg-foreground/20 dark:group-hover:bg-white/20 group-hover:text-foreground dark:group-hover:text-white group-hover:border-foreground/30 dark:group-hover:border-white/30 transition-colors shadow-none`}>
          <StatusIcon className="w-3 h-3" />
          <span className="capitalize text-[10px] font-bold">{payment.status}</span>
        </Badge>
      </td>
      <td className="p-4 text-center">          <span className="text-xs font-medium group-hover:text-foreground dark:group-hover:text-white transition-colors">{payment.method}</span>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          {payment.status === 'pending' && (
            <Button
              variant="gold"
              size="sm"
              className="h-8 text-[10px] font-black uppercase tracking-widest shadow-gold hover:scale-[1.05] transition-all"
              onClick={() => setVerifyingPayment(payment)}
            >
              Verify
            </Button>
          )}
          {(payment.status === 'completed' || payment.status === 'paid' || payment.status === 'successful') && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
