import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import {
  GET_ALL_REFUND_REQUESTS,
  GET_REFUND_REQUEST_STATS,
} from "@/lib/graphql/queries";
import {
  VERIFY_REFUND_REQUEST,
  APPROVE_REFUND,
  FORCE_APPROVE_REFUND,
  REJECT_REFUND,
} from "@/lib/graphql/mutations";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Loader2,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Ban,
  Zap,
  ChevronDown,
  ChevronRight,
  Filter,
  UserCheck,
  FileText,
  Banknote,
  TrendingUp,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface RefundItem {
  id: string;
  paymentId: string;
  userId: string;
  user: { id: string; username: string; fullName: string; email: string };
  amount: number;
  currency: string;
  reason: string;
  status: string;
  adminNote?: string;
  verifiedAt?: string;
  approvedAt?: string;
  forceApproved: boolean;
  refundedAmount: number;
  refundFee: number;
  refundableAmountAfterFee: number;
  createdAt: string;
  updatedAt: string;
}

interface RefundStats {
  totalRequests: number;
  pendingCount: number;
  verifiedCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalRefunded: number;
  totalRefundFee: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  admin_verified: { label: "Verified", variant: "secondary", icon: UserCheck },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
};

function formatCurrency(amount: number): string {
  return (amount || 0).toLocaleString() + " RWF";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "MMM dd, yyyy HH:mm");
  } catch {
    return dateStr;
  }
}

export default function SuperAdminRefunds() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const LIMIT = 20;

  const [noteInput, setNoteInput] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const [selectedAction, setSelectedAction] = useState<{
    type: "verify" | "approve" | "forceApprove" | "reject";
    id: string;
  } | null>(null);

  const { data, loading, refetch } = useQuery(GET_ALL_REFUND_REQUESTS, {
    variables: { page, limit: LIMIT, status: statusFilter || undefined },
    pollInterval: 30000,
  });

  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useQuery(GET_REFUND_REQUEST_STATS, {
    pollInterval: 60000,
  });

  const [verifyRefund, { loading: verifying }] = useMutation(VERIFY_REFUND_REQUEST);
  const [approveRefund, { loading: approving }] = useMutation(APPROVE_REFUND);
  const [forceApproveRefund, { loading: forceApproving }] = useMutation(FORCE_APPROVE_REFUND);
  const [rejectRefund, { loading: rejecting }] = useMutation(REJECT_REFUND);

  const refunds: RefundItem[] = (data as any)?.getAllRefundRequests?.items || [];
  const pagination = (data as any)?.getAllRefundRequests?.pagination;
  const stats: RefundStats = (statsData as any)?.getRefundRequestStats;

  const handleVerify = async () => {
    if (!selectedAction) return;
    try {
      await verifyRefund({ variables: { id: selectedAction.id, note: noteInput || undefined } });
      toast.success("Refund request verified!");
      setSelectedAction(null);
      setNoteInput("");
      refetch();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to verify");
    }
  };

  const handleApprove = async () => {
    if (!selectedAction) return;
    try {
      await approveRefund({ variables: { id: selectedAction.id, note: noteInput || undefined } });
      toast.success("Refund approved! All related items cancelled.");
      setSelectedAction(null);
      setNoteInput("");
      refetch();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    }
  };

  const handleForceApprove = async () => {
    if (!selectedAction) return;
    try {
      await forceApproveRefund({ variables: { id: selectedAction.id, note: noteInput || undefined } });
      toast.success("Refund force-approved! All related items cancelled.");
      setSelectedAction(null);
      setNoteInput("");
      refetch();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to force approve");
    }
  };

  const handleReject = async () => {
    if (!selectedAction) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      await rejectRefund({ variables: { id: selectedAction.id, reason: rejectReason } });
      toast.success("Refund request rejected.");
      setSelectedAction(null);
      setRejectReason("");
      refetch();
      refetchStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    }
  };

  const totalPages = pagination?.totalPages || 1;
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  }, [totalPages, page]);

  const actionLoading = verifying || approving || forceApproving || rejecting;

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-destructive" />
              Refund Requests
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Review and process payment refund requests. Only refundable within 3 days of payment.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {stats && !statsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">{stats.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-blue-500">{stats.verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-500">{stats.approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-red-500">{stats.rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Row */}
        {stats && (
          <Card className="bg-gradient-to-r from-destructive/5 via-destructive/5 to-transparent border-destructive/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium">Total Refunded:</span>
                <span className="text-lg font-bold">{formatCurrency(stats.totalRefunded)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { refetch(); refetchStats(); }} className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status:</span>
              </div>
              <Select
                value={statusFilter || "__all__"}
                onValueChange={(v) => {
                  setStatusFilter(v === "__all__" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="admin_verified">Verified</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-auto">
                {pagination?.totalCount || 0} total
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No refund requests found</p>
                <p className="text-sm mt-1">Refund requests appear here after someone requests a refund</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((r) => {
                      const StatusIcon = statusConfig[r.status]?.icon || Clock;
                      return (
                        <>
                          <TableRow
                            key={r.id}
                            className="cursor-pointer hover:bg-accent/5"
                            onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                          >
                            <TableCell>
                              {expandedRow === r.id ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{r.user?.fullName || r.user?.username || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{r.user?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(r.amount)}</TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="text-sm truncate">{r.reason}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[r.status]?.variant || "outline"} className="flex items-center gap-1 w-fit">
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig[r.status]?.label || r.status}
                              </Badge>
                              {r.forceApproved && r.status === "approved" && (
                                <Badge variant="secondary" className="ml-1 text-[10px]">
                                  <Zap className="w-3 h-3 mr-0.5" /> Force
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(r.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {r.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAction({ type: "verify", id: r.id });
                                      }}
                                      title="Verify refund"
                                      className="h-7"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAction({ type: "reject", id: r.id });
                                      }}
                                      title="Reject refund"
                                      className="h-7 text-destructive"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                                {r.status === "admin_verified" && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAction({ type: "approve", id: r.id });
                                      }}
                                      title="Approve refund"
                                      className="h-7 text-xs"
                                    >
                                      <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAction({ type: "forceApprove", id: r.id });
                                      }}
                                      title="Force approve (bypass verification)"
                                      className="h-7 text-xs"
                                    >
                                      <Zap className="w-3 h-3 mr-1" /> Force
                                    </Button>
                                  </>
                                )}
                                {(r.status === "pending") && (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAction({ type: "forceApprove", id: r.id });
                                      }}
                                      title="Force approve (bypass verification)"
                                      className="h-7 text-xs"
                                    >
                                      <Zap className="w-3 h-3 mr-1" /> Force
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedRow === r.id && (
                            <TableRow key={`${r.id}-detail`}>
                              <TableCell colSpan={7} className="bg-accent/5 p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Payment ID</p>
                                    <p className="font-mono text-xs">{r.paymentId}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Amount</p>
                                    <p className="font-medium">{formatCurrency(r.amount)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Refunded Amount</p>
                                    <p className="font-medium">{formatCurrency(r.refundedAmount)}</p>
                                  </div>
                                  {r.status === "approved" && (
                                    <>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Platform Fee (5%)</p>
                                        <p className="font-medium text-amber-500">{formatCurrency(r.refundFee)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground font-medium">Customer Gets Back</p>
                                        <p className="font-medium text-green-600">{formatCurrency(r.refundableAmountAfterFee)}</p>
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Status</p>
                                    <Badge variant={statusConfig[r.status]?.variant || "outline"}>
                                      {statusConfig[r.status]?.label || r.status}
                                    </Badge>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground font-medium">Reason</p>
                                    <p className="text-sm">{r.reason}</p>
                                  </div>
                                  {r.adminNote && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-muted-foreground font-medium">Admin Note</p>
                                      <p className="text-sm">{r.adminNote}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Verified At</p>
                                    <p className="text-sm">{formatDate(r.verifiedAt || "")}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground font-medium">Approved At</p>
                                    <p className="text-sm">{formatDate(r.approvedAt || "")}</p>
                                  </div>
                                  {r.forceApproved && (
                                    <div className="col-span-full">
                                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                        <Zap className="w-3 h-3" /> Force Approved by Super Admin
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Pagination className="w-auto mx-0">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                            className={page <= 1 ? "pointer-events-none opacity-40" : ""}
                          />
                        </PaginationItem>
                        {pageNumbers.map((p, idx) =>
                          p === "..." ? (
                            <PaginationItem key={`ellipsis-${idx}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href="#"
                                isActive={p === page}
                                onClick={(e) => { e.preventDefault(); setPage(p as number); }}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                            className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
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

        {/* Action Dialogs */}
        <Dialog open={!!selectedAction} onOpenChange={() => { setSelectedAction(null); setNoteInput(""); setRejectReason(""); }}>
          <DialogContent>
            {selectedAction?.type === "reject" ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Ban className="w-5 h-5 text-destructive" />
                    Reject Refund Request
                  </DialogTitle>
                  <DialogDescription>
                    Provide a reason for rejecting this refund request. The student will be notified.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rejection Reason</Label>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this refund is being rejected..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedAction(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
                    {rejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Reject Refund
                  </Button>
                </DialogFooter>
              </>
            ) : selectedAction?.type === "verify" ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    Verify Refund Request
                  </DialogTitle>
                  <DialogDescription>
                    Confirm that the refund request is valid and mark it as verified. This sends it to super admin for final approval.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Admin Note (optional)</Label>
                    <Textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add any verification notes..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedAction(null)}>Cancel</Button>
                  <Button onClick={handleVerify} disabled={verifying}>
                    {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Mark as Verified
                  </Button>
                </DialogFooter>
              </>
            ) : selectedAction?.type === "approve" ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Approve Refund
                  </DialogTitle>
                  <DialogDescription>
                    This will cancel all related course enrollments, internship access, certificates, and disbursements. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <p className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <strong>Warning:</strong> Student's course access, progress, internship, and certificates will be revoked.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add approval notes..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedAction(null)}>Cancel</Button>
                  <Button variant="default" onClick={handleApprove} disabled={approving}>
                    {approving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Approve Refund
                  </Button>
                </DialogFooter>
              </>
            ) : selectedAction?.type === "forceApprove" ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-500" />
                    Force Approve Refund
                  </DialogTitle>
                  <DialogDescription>
                    Force-approve this refund bypassing the admin verification step. All related items will be cancelled immediately.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <p className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <strong>Super Admin Override:</strong> This bypasses admin verification. All enrollments, progress, internships, and certificates will be revoked.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Why are you force-approving this?"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedAction(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleForceApprove} disabled={forceApproving}>
                    {forceApproving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    <Zap className="w-4 h-4 mr-1" /> Force Approve
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
}
